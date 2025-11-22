import os
import asyncio
from typing import List, Optional, Dict, Any
from pathlib import Path

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.retrievers import BM25Retriever
try:
    from langchain.retrievers import EnsembleRetriever
except ImportError:
    # Fallback for langchain 0.3.0+
    from langchain_community.retrievers import EnsembleRetriever

from models.hybrid_search import SearchResult, ResumeScores
from services.resume_evaluator import ResumeEvaluatorAgent
from services.resume_evaluator import ResumeEvaluator


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
        # RecursiveCharacterTextSplitter preserves metadata automatically
        chunks = self.text_splitter.split_documents(documents)

        # Verify metadata is preserved in chunks
        if documents and documents[0].metadata:
            # Ensure all chunks have the same metadata as the original document
            for chunk in chunks:
                if not chunk.metadata:
                    chunk.metadata = {}
                # Copy metadata from original document if not present
                for key, value in documents[0].metadata.items():
                    if key not in chunk.metadata:
                        chunk.metadata[key] = value

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

            # Ensure all NEW chunks have metadata before recreating vector store
            # Don't modify existing_chunks metadata, only new chunks
            if documents and chunks:
                original_metadata = documents[0].metadata if documents else {}
                # Only update metadata for new chunks (from current documents)
                for chunk in chunks:  # Only new chunks, not existing_chunks
                    if not chunk.metadata:
                        chunk.metadata = {}
                    # Ensure all metadata from original document is in new chunk
                    for key, value in original_metadata.items():
                        if key not in chunk.metadata:
                            chunk.metadata[key] = value

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
            # Verify chunks have metadata before indexing
            if chunks and documents:
                for chunk in chunks:
                    if not chunk.metadata:
                        chunk.metadata = {}
                    # Ensure all metadata from original document is in chunk
                    for key, value in documents[0].metadata.items():
                        if key not in chunk.metadata:
                            chunk.metadata[key] = value

            self.vector_store = Chroma.from_documents(
                documents=chunks,
                embedding=self.embeddings,
                persist_directory=self.persist_directory
            )
            self.documents = chunks

        # Persist ChromaDB (if persist method exists)
        if hasattr(self.vector_store, 'persist'):
            self.vector_store.persist()

        # Verify metadata was saved in ChromaDB
        if self.vector_store and self.vector_store._collection:
            try:
                sample = self.vector_store._collection.get(limit=1)
                if sample and 'metadatas' in sample and len(sample['metadatas']) > 0:
                    sample_metadata = sample['metadatas'][0]
                    print(
                        f"DEBUG: Sample metadata in ChromaDB: {sample_metadata}")
            except Exception as e:
                print(f"DEBUG: Error checking ChromaDB metadata: {e}")

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
        search_type: str = "hybrid",
        job_description: str = ""
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

            # Get results from both retrievers separately to calculate individual scores
            # Vector retriever
            vector_retriever = self.vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={"k": k}
            )
            try:
                vector_docs = await vector_retriever.aget_relevant_documents(query)
            except AttributeError:
                vector_docs = await asyncio.to_thread(
                    vector_retriever.get_relevant_documents,
                    query
                )

            # BM25 retriever
            self.bm25_retriever.k = k
            try:
                bm25_docs = await self.bm25_retriever.aget_relevant_documents(query)
            except AttributeError:
                bm25_docs = await asyncio.to_thread(
                    self.bm25_retriever.get_relevant_documents,
                    query
                )

            # Use ensemble retriever for final ranking
            try:
                ensemble_docs = await self.ensemble_retriever.aget_relevant_documents(query)
            except AttributeError:
                ensemble_docs = await asyncio.to_thread(
                    self.ensemble_retriever.get_relevant_documents,
                    query
                )

            # Limit to k results
            ensemble_docs = ensemble_docs[:k]

            # Create a map of document content to scores
            vector_scores_map = {}
            for i, doc in enumerate(vector_docs):
                # Normalize vector score based on position (higher rank = higher score)
                vector_score = 1.0 - (i / max(len(vector_docs), 1))
                vector_scores_map[doc.page_content] = vector_score

            bm25_scores_map = {}
            for i, doc in enumerate(bm25_docs):
                # Normalize BM25 score based on position
                bm25_score = 1.0 - (i / max(len(bm25_docs), 1))
                bm25_scores_map[doc.page_content] = bm25_score

            # Create SearchResult objects with hybrid scores
            for i, doc in enumerate(ensemble_docs):
                # Get individual scores
                vector_score = vector_scores_map.get(doc.page_content, 0.0)
                bm25_score = bm25_scores_map.get(doc.page_content, 0.0)

                # Calculate hybrid score: alpha * vector_score + (1 - alpha) * bm25_score
                # alpha = vector_weight
                alpha = self.vector_weight
                hybrid_score = (alpha * vector_score) + \
                    ((1 - alpha) * bm25_score)

                # Store scores in metadata for later use
                from models.hybrid_search import HybridScores
                hybrid_scores = HybridScores(
                    vector_score=round(vector_score, 3),
                    bm25_score=round(bm25_score, 3),
                    hybrid_score=round(hybrid_score, 3)
                )

                # Create a dummy ResumeScores for compatibility (will be replaced)
                scores = ResumeScores(
                    technical_skills=hybrid_score,
                    experience=hybrid_score,
                    overall_match=hybrid_score
                )

                results.append(SearchResult(
                    content=doc.page_content,
                    score=round(hybrid_score, 3),
                    scores=scores,
                    search_type="hybrid",
                    metadata={**doc.metadata,
                              "hybrid_scores": hybrid_scores.dict()}
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

            # Create SearchResult objects with three evaluation scores using AI agent
            evaluator = ResumeEvaluatorAgent()
            job_desc = job_description if job_description else query

            for i, doc in enumerate(docs):
                # Calculate three separate scores using AI agent
                scores_dict = await evaluator.evaluate_resume(
                    job_description=job_desc,
                    resume_content=doc.page_content,
                    semantic_similarity=0.0,  # Vector retriever similarity not directly available
                    position_rank=i,
                    total_results=len(docs)
                )

                scores = ResumeScores(**scores_dict)
                overall_score = (scores.technical_skills +
                                 scores.experience + scores.overall_match) / 3.0

                results.append(SearchResult(
                    content=doc.page_content,
                    score=round(overall_score, 3),
                    scores=scores,
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

            # Create SearchResult objects with three evaluation scores using AI agent
            evaluator = ResumeEvaluatorAgent()
            job_desc = job_description if job_description else query

            for i, doc in enumerate(docs):
                # Calculate three separate scores using AI agent
                scores_dict = await evaluator.evaluate_resume(
                    job_description=job_desc,
                    resume_content=doc.page_content,
                    semantic_similarity=0.0,  # BM25 doesn't provide semantic similarity
                    position_rank=i,
                    total_results=len(docs)
                )

                scores = ResumeScores(**scores_dict)
                overall_score = (scores.technical_skills +
                                 scores.experience + scores.overall_match) / 3.0

                results.append(SearchResult(
                    content=doc.page_content,
                    score=round(overall_score, 3),
                    scores=scores,
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
