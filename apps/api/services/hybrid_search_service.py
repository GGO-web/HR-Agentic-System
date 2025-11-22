"""
Main service module for hybrid search pipeline.
Orchestrates the ETL pipeline: Load -> Sanitize -> Chunk -> Index -> Search
"""
import os
from typing import List, Optional, Dict, Any
from pathlib import Path

from langchain_core.documents import Document

from services.document_loader import DocumentLoader
from services.text_sanitizer import TextSanitizer
from services.hybrid_matcher import HybridMatcher
from models.hybrid_search import CandidateDocument, SearchResult


class HybridSearchService:
    """Main service for processing resumes and job descriptions with hybrid search."""

    def __init__(
        self,
        persist_directory: str = "./chroma_db",
        embedding_model: str = "sentence-transformers/all-mpnet-base-v2"
    ):
        """
        Initialize HybridSearchService.

        Args:
            persist_directory: Directory to persist ChromaDB
            embedding_model: HuggingFace model name for embeddings
        """
        self.document_loader = DocumentLoader()
        self.text_sanitizer = TextSanitizer()
        self.hybrid_matcher = HybridMatcher(
            persist_directory=persist_directory,
            embedding_model=embedding_model
        )

    async def process_resume(
        self,
        file_path: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """
        Process resume file through the ETL pipeline.

        Pipeline: Load Document -> Sanitize (PII Removal) -> Chunking -> Vectorization -> Hybrid Indexing

        Args:
            file_path: Path to resume file (PDF or DOCX)
            metadata: Additional metadata to attach to the document

        Returns:
            List of processed LangChain Document objects
        """
        # Step 1: Load and parse document
        documents = await self.document_loader.load_document(file_path, metadata)

        # Step 2: Sanitize text (PII removal)
        for doc in documents:
            doc.page_content = self.text_sanitizer.clean_text(doc.page_content)

        # Step 3: Index documents (chunking, vectorization, and indexing happen here)
        await self.hybrid_matcher.index_documents(documents)

        return documents

    async def find_matches(
        self,
        job_description: str,
        k: int = 5,
        search_type: str = "hybrid"
    ) -> List[SearchResult]:
        """
        Find matching resume chunks for a job description.

        Args:
            job_description: Job description text to search against
            k: Number of results to return (default 5)
            search_type: Type of search - "hybrid" (default), "vector", or "keyword"

        Returns:
            List of SearchResult objects with matching content
        """
        # Sanitize job description
        sanitized_query = self.text_sanitizer.clean_text(job_description)

        # Find matches using hybrid search
        results = await self.hybrid_matcher.find_matches(
            query=sanitized_query,
            k=k,
            search_type=search_type
        )

        return results

    async def add_documents(
        self,
        documents: List[Document]
    ) -> None:
        """
        Add additional documents to the existing index.

        Args:
            documents: List of LangChain Document objects to add
        """
        # Sanitize documents
        for doc in documents:
            doc.page_content = self.text_sanitizer.clean_text(doc.page_content)

        # Add to existing documents
        self.hybrid_matcher.documents.extend(documents)

        # Re-index all documents
        await self.hybrid_matcher.index_documents(self.hybrid_matcher.documents)

    def load_existing_index(self) -> bool:
        """
        Load existing index if available.

        Returns:
            True if index was loaded successfully, False otherwise
        """
        return self.hybrid_matcher.load_existing_index()


# Convenience functions for direct use
async def process_resume(
    file_path: str,
    metadata: Optional[Dict[str, Any]] = None,
    persist_directory: str = "./chroma_db"
) -> List[Document]:
    """
    Process a resume file through the ETL pipeline.

    Args:
        file_path: Path to resume file (PDF or DOCX)
        metadata: Additional metadata to attach
        persist_directory: Directory to persist ChromaDB

    Returns:
        List of processed LangChain Document objects
    """
    service = HybridSearchService(persist_directory=persist_directory)
    return await service.process_resume(file_path, metadata)


async def find_matches(
    job_description: str,
    k: int = 5,
    search_type: str = "hybrid",
    persist_directory: str = "./chroma_db"
) -> List[SearchResult]:
    """
    Find matching resume chunks for a job description.

    Args:
        job_description: Job description text to search against
        k: Number of results to return (default 5)
        search_type: Type of search - "hybrid" (default), "vector", or "keyword"
        persist_directory: Directory where ChromaDB is persisted

    Returns:
        List of SearchResult objects with matching content
    """
    service = HybridSearchService(persist_directory=persist_directory)

    # Try to load existing index
    index_loaded = service.load_existing_index()

    if not index_loaded:
        # If no index exists, return empty results with a helpful message
        # This should not happen in normal flow, but handle gracefully
        return []

    return await service.find_matches(job_description, k, search_type)
