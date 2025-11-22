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
from models.hybrid_search import CandidateDocument, SearchResult, CandidateMatchResult, ResumeScores, HybridScores, CandidateAnalysisReport


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
        self.text_sanitizer = TextSanitizer()  # Now an instance, not static
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
        k: int = 10  # Number of candidates to return
    ) -> List[CandidateMatchResult]:
        """
        Find matching candidates for a job description.
        Groups chunks by candidate_id and evaluates each candidate's full resume.

        Args:
            job_description: Job description text to search against
            k: Number of chunks to retrieve (default 10, will be grouped by candidate)
            search_type: Type of search - "hybrid" (default), "vector", or "keyword"

        Returns:
            List of CandidateMatchResult objects - one per candidate with three evaluation scores
        """
        # Sanitize job description
        sanitized_query = self.text_sanitizer.clean_text(job_description)

        # Find matching chunks using hybrid search (always uses hybrid)
        chunk_results = await self.hybrid_matcher.find_matches(
            query=sanitized_query,
            k=k * 3,  # Get more chunks to ensure we capture all candidates
            search_type="hybrid",  # Always use hybrid search
            job_description=job_description  # Pass original for evaluation
        )

        # Group chunks by candidate_id
        candidates_chunks: Dict[str, List[SearchResult]] = {}
        for chunk_result in chunk_results:
            candidate_id = chunk_result.metadata.get('candidate_id')
            if candidate_id:
                candidate_id_str = str(candidate_id)
                if candidate_id_str not in candidates_chunks:
                    candidates_chunks[candidate_id_str] = []
                candidates_chunks[candidate_id_str].append(chunk_result)

        # For each candidate, aggregate hybrid scores from chunks and generate analysis report
        from services.resume_evaluator import ResumeEvaluatorAgent
        evaluator = ResumeEvaluatorAgent()
        
        candidate_results: List[CandidateMatchResult] = []
        
        for candidate_id, chunks in candidates_chunks.items():
            # Aggregate scores from all chunks for this candidate
            vector_scores = []
            bm25_scores = []
            hybrid_scores_list = []
            
            for chunk in chunks:
                # Get hybrid scores from metadata
                hybrid_scores_data = chunk.metadata.get('hybrid_scores')
                if hybrid_scores_data:
                    vector_scores.append(hybrid_scores_data.get('vector_score', 0.0))
                    bm25_scores.append(hybrid_scores_data.get('bm25_score', 0.0))
                    hybrid_scores_list.append(hybrid_scores_data.get('hybrid_score', 0.0))
            
            # Calculate average scores for the candidate
            avg_vector_score = sum(vector_scores) / len(vector_scores) if vector_scores else 0.0
            avg_bm25_score = sum(bm25_scores) / len(bm25_scores) if bm25_scores else 0.0
            avg_hybrid_score = sum(hybrid_scores_list) / len(hybrid_scores_list) if hybrid_scores_list else 0.0
            
            # Create HybridScores object
            scores = HybridScores(
                vector_score=round(avg_vector_score, 3),
                bm25_score=round(avg_bm25_score, 3),
                hybrid_score=round(avg_hybrid_score, 3)
            )
            
            # Generate analysis report using AI
            # Combine all chunks for full resume content
            full_resume_content = " ".join([chunk.content for chunk in chunks])
            
            report_dict = await evaluator.generate_analysis_report(
                job_description=job_description,
                resume_content=full_resume_content,
                hybrid_score=avg_hybrid_score
            )
            
            report = CandidateAnalysisReport(**report_dict)
            
            candidate_results.append(CandidateMatchResult(
                candidate_id=candidate_id,
                scores=scores,
                report=report
            ))
        
        # Sort by hybrid score (descending)
        candidate_results.sort(key=lambda x: x.scores.hybrid_score, reverse=True)
        
        # Limit to top k candidates
        return candidate_results[:k]

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
    k: int = 10,
    persist_directory: str = "./chroma_db"
) -> List[CandidateMatchResult]:
    """
    Find matching candidates for a job description.

    Args:
        job_description: Job description text to search against
        k: Number of candidates to return (default 10)
        persist_directory: Directory where ChromaDB is persisted

    Returns:
        List of CandidateMatchResult objects - one per candidate with three AI evaluation scores
    """
    service = HybridSearchService(persist_directory=persist_directory)

    # Try to load existing index
    index_loaded = service.load_existing_index()

    if not index_loaded:
        # If no index exists, return empty results
        return []

    return await service.find_matches(job_description, k)
