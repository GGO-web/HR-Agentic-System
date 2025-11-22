import os
import asyncio
from typing import List, Optional, Dict, Any
from pathlib import Path

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever

from models.hybrid_search import SearchResult


class HybridMatcher:
    """Class for hybrid search using vector and keyword retrieval."""

    def __init__(
        self,
        persist_directory: str = "./chroma_db",
        embedding_model: str = "sentence-transformers/all-mpnet-base-v2",
        chunk_size: int = 500,
        chunk_overlap: int = 50,
        vector_weight: float = 0.7,
        bm25_weight: float = 0.3
    ):
        """
        Initialize HybridMatcher with vector and keyword retrievers.

        Args:
            persist_directory: Directory to persist ChromaDB
            embedding_model: HuggingFace model name for embeddings
            chunk_size: Size of text chunks
            chunk_overlap: Overlap between chunks
            vector_weight: Weight for vector search (default 0.7)
            bm25_weight: Weight for BM25 search (default 0.3)
        """
        self.persist_directory = persist_directory
        self.embedding_model = embedding_model
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.vector_weight = vector_weight
        self.bm25_weight = bm25_weight

        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", " ", ""]
        )

        # Initialize embeddings
        self.embeddings = HuggingFaceEmbeddings(
            model_name=embedding_model,
            model_kwargs={'device': 'cpu'}  # Use 'cuda' if GPU available
        )

        # Initialize vector store and retrievers (will be set after indexing)
        self.vector_store: Optional[Chroma] = None
        self.bm25_retriever: Optional[BM25Retriever] = None
        self.ensemble_retriever: Optional[EnsembleRetriever] = None

        # Store documents for BM25 indexing
        self.documents: List[Document] = []

    async def index_documents(self, documents: List[Document]) -> None:
        """
        Index documents for hybrid search.
        If documents already exist, adds to existing index.

        Args:
            documents: List of LangChain Document objects to index
        """
        # Split documents into chunks
        chunks = self.text_splitter.split_documents(documents)

        # If vector store already exists, add to it; otherwise create new
        if self.vector_store is not None:
            # Add new chunks to existing store
            # Note: ChromaDB doesn't have a direct add_documents method that persists
            # So we need to recreate the store with all documents
            # Get existing documents from ChromaDB
            try:
                collection = self.vector_store._collection
                if collection:
                    existing_results = collection.get()
                    if existing_results and 'documents' in existing_results:
                        # Recreate existing documents
                        existing_chunks = []
                        for i, doc_text in enumerate(existing_results['documents']):
                            metadata = existing_results.get('metadatas', [{}])[
                                i] if existing_results.get('metadatas') else {}
                            existing_chunks.append(
                                Document(page_content=doc_text, metadata=metadata))
                        # Combine with new chunks
                        all_chunks = existing_chunks + chunks
                    else:
                        all_chunks = chunks
                else:
                    all_chunks = chunks
            except Exception:
                # If we can't load existing, just use new chunks
                all_chunks = chunks

            # Recreate vector store with all chunks
            self.vector_store = Chroma.from_documents(
                documents=all_chunks,
                embedding=self.embeddings,
                persist_directory=self.persist_directory
            )

            # Update documents list
            if hasattr(self, 'documents') and self.documents:
                self.documents.extend(all_chunks)
            else:
                self.documents = all_chunks
        else:
            # Create new vector store
            self.vector_store = Chroma.from_documents(
                documents=chunks,
                embedding=self.embeddings,
                persist_directory=self.persist_directory
            )
            self.documents = chunks

        # Persist ChromaDB (if persist method exists)
        if hasattr(self.vector_store, 'persist'):
            self.vector_store.persist()

        # Recreate BM25 retriever with all chunks
        self.bm25_retriever = BM25Retriever.from_documents(self.documents)
        self.bm25_retriever.k = 10  # Retrieve top 10 for ensemble

        # Initialize vector retriever
        vector_retriever = self.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 10}  # Retrieve top 10 for ensemble
        )

        # Create ensemble retriever with specified weights
        self.ensemble_retriever = EnsembleRetriever(
            retrievers=[vector_retriever, self.bm25_retriever],
            weights=[self.vector_weight, self.bm25_weight]
        )

    async def find_matches(
        self,
        query: str,
        k: int = 5,
        search_type: str = "hybrid"
    ) -> List[SearchResult]:
        """
        Find matching documents using hybrid search.

        Args:
            query: Search query (e.g., job description)
            k: Number of results to return
            search_type: Type of search - "hybrid", "vector", or "keyword"

        Returns:
            List of SearchResult objects
        """
        results: List[SearchResult] = []

        if search_type == "hybrid":
            if not self.ensemble_retriever:
                # Try to load existing index if not already loaded
                if not self.load_existing_index():
                    raise ValueError(
                        "Documents must be indexed before searching. Call index_documents() first or ensure resumes have been uploaded.")

            # Use ensemble retriever (run in thread if async method not available)
            try:
                docs = await self.ensemble_retriever.aget_relevant_documents(query)
            except AttributeError:
                # Fallback to sync method in thread pool
                docs = await asyncio.to_thread(
                    self.ensemble_retriever.get_relevant_documents,
                    query
                )

            # Limit to k results
            docs = docs[:k]

            # Create SearchResult objects with normalized scores
            for i, doc in enumerate(docs):
                # Calculate normalized score based on position (higher rank = higher score)
                score = 1.0 - (i / max(len(docs), 1)) if docs else 0.0

                results.append(SearchResult(
                    content=doc.page_content,
                    score=score,
                    search_type="hybrid",
                    metadata=doc.metadata
                ))

        elif search_type == "vector":
            if not self.vector_store:
                raise ValueError(
                    "Vector store not initialized. Call index_documents() first.")

            vector_retriever = self.vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={"k": k}
            )

            # Try async method, fallback to sync in thread pool
            try:
                docs = await vector_retriever.aget_relevant_documents(query)
            except AttributeError:
                docs = await asyncio.to_thread(
                    vector_retriever.get_relevant_documents,
                    query
                )

            # Create SearchResult objects with position-based scores
            for i, doc in enumerate(docs):
                score = 1.0 - (i / max(len(docs), 1)) if docs else 0.0
                results.append(SearchResult(
                    content=doc.page_content,
                    score=score,
                    search_type="vector",
                    metadata=doc.metadata
                ))

        elif search_type == "keyword":
            if not self.bm25_retriever:
                raise ValueError(
                    "BM25 retriever not initialized. Call index_documents() first.")

            self.bm25_retriever.k = k

            # Try async method, fallback to sync in thread pool
            try:
                docs = await self.bm25_retriever.aget_relevant_documents(query)
            except AttributeError:
                docs = await asyncio.to_thread(
                    self.bm25_retriever.get_relevant_documents,
                    query
                )

            # Create SearchResult objects with position-based scores
            for i, doc in enumerate(docs):
                score = 1.0 - (i / max(len(docs), 1)) if docs else 0.0
                results.append(SearchResult(
                    content=doc.page_content,
                    score=score,
                    search_type="keyword",
                    metadata=doc.metadata
                ))

        else:
            raise ValueError(
                f"Invalid search_type: {search_type}. Must be 'hybrid', 'vector', or 'keyword'")

        return results

    def load_existing_index(self) -> bool:
        """
        Load existing ChromaDB index if available.
        Also loads documents from ChromaDB to recreate BM25 and ensemble retrievers.

        Returns:
            True if index was loaded successfully, False otherwise
        """
        if not os.path.exists(self.persist_directory):
            return False

        try:
            self.vector_store = Chroma(
                persist_directory=self.persist_directory,
                embedding_function=self.embeddings
            )

            # Load documents from ChromaDB to recreate retrievers
            try:
                # Get all documents from ChromaDB collection
                collection = self.vector_store._collection
                if collection:
                    # Fetch all documents from ChromaDB
                    results = collection.get()
                    if results and 'documents' in results and results['documents']:
                        # Recreate Document objects from ChromaDB data
                        chunks = []
                        for i, doc_text in enumerate(results['documents']):
                            metadata = results.get('metadatas', [{}])[
                                i] if results.get('metadatas') else {}
                            chunks.append(
                                Document(page_content=doc_text, metadata=metadata))

                        if chunks:
                            # Store chunks as documents (they are already chunked)
                            self.documents = chunks

                            # Recreate BM25 retriever with chunks
                            self.bm25_retriever = BM25Retriever.from_documents(
                                chunks)
                            self.bm25_retriever.k = 10

                            # Recreate vector retriever
                            vector_retriever = self.vector_store.as_retriever(
                                search_type="similarity",
                                search_kwargs={"k": 10}
                            )

                            # Recreate ensemble retriever
                            self.ensemble_retriever = EnsembleRetriever(
                                retrievers=[vector_retriever,
                                            self.bm25_retriever],
                                weights=[self.vector_weight, self.bm25_weight]
                            )
            except Exception as e:
                # If we can't load documents, at least we have the vector store
                print(f"Warning: Could not load documents from ChromaDB: {e}")
                # Return True anyway since vector store is loaded
                return True

            return True
        except Exception as e:
            print(f"Error loading index: {e}")
            return False
