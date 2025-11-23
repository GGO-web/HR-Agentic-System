"""
API routes for hybrid search functionality.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
from pydantic import BaseModel, Field

from services.hybrid_search_service import HybridSearchService, process_resume, find_matches
from models.hybrid_search import SearchResult, CandidateMatchResult

router = APIRouter(prefix="/hybrid-search", tags=["hybrid-search"])


class JobDescriptionRequest(BaseModel):
    """Request model for job description search."""
    job_description: str = Field(...,
                                 description="Job description text to search against")
    k: int = Field(default=5, ge=1, le=20,
                   description="Number of results to return")
    search_type: str = Field(
        default="hybrid", description="Search type: hybrid, vector, or keyword")
    job_description_id: Optional[str] = Field(
        default=None, description="Optional Convex job description ID to save results")


class CandidateMatchResponse(BaseModel):
    """Response model for candidate match results."""
    results: List[CandidateMatchResult]
    query: str
    total_candidates: int


class SanitizedResumeResponse(BaseModel):
    """Response model for sanitized resume."""
    candidate_id: str
    sanitized_content: str
    filename: Optional[str] = None


@router.post("/process-resume", summary="Process a resume file")
async def process_resume_file(
    file: UploadFile = File(..., description="Resume file (PDF or DOCX)"),
    candidate_id: Optional[str] = Form(
        None, description="Candidate ID for metadata")
):
    """
    Process a resume file through the ETL pipeline.

    Pipeline: Load Document -> Sanitize (PII Removal) -> Chunking -> Vectorization -> Hybrid Indexing

    Args:
        file: Uploaded resume file
        candidate_id: Optional candidate ID for metadata

    Returns:
        Success message with document count and sanitized content
    """
    try:
        # Save uploaded file temporarily
        import tempfile
        import os

        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in [".pdf", ".docx", ".doc"]:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file format. Please upload PDF or DOCX file."
            )

        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        try:
            # Process resume
            metadata = {}
            if candidate_id:
                metadata["candidate_id"] = candidate_id
            if file.filename:
                metadata["original_filename"] = file.filename

            service = HybridSearchService()
            documents = await service.process_resume(tmp_path, metadata)

            # Get sanitized content from documents
            sanitized_content = "\n\n".join(
                [doc.page_content for doc in documents])

            # Debug: Verify metadata was preserved in chunks
            if candidate_id:
                # Check if chunks have the metadata
                if service.hybrid_matcher.vector_store:
                    try:
                        collection = service.hybrid_matcher.vector_store._collection
                        if collection:
                            # Get a sample to verify metadata
                            sample_results = collection.get(limit=1)
                            if sample_results and 'metadatas' in sample_results and len(sample_results['metadatas']) > 0:
                                sample_metadata = sample_results['metadatas'][0]
                                print(
                                    f"DEBUG: Sample chunk metadata after indexing: {sample_metadata}")
                                if 'candidate_id' not in sample_metadata:
                                    print(
                                        f"WARNING: candidate_id not found in chunk metadata!")
                    except Exception as e:
                        print(f"DEBUG: Error checking metadata: {e}")

            return {
                "message": "Resume processed successfully",
                "document_count": len(documents),
                "filename": file.filename,
                "sanitized_content": sanitized_content,
                "candidate_id": candidate_id
            }
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing resume: {str(e)}")


@router.get("/sanitized-resume/{candidate_id}", response_model=SanitizedResumeResponse, summary="Get sanitized resume for a candidate")
async def get_sanitized_resume(candidate_id: str):
    """
    Get sanitized resume content for a specific candidate.

    Args:
        candidate_id: Candidate ID (Convex user ID) to get resume for

    Returns:
        Sanitized resume content
    """
    """
    Get sanitized resume content for a specific candidate.
    
    Args:
        candidate_id: Candidate ID to get resume for
        
    Returns:
        Sanitized resume content
    """
    try:
        service = HybridSearchService()

        # Load existing index
        if not service.load_existing_index():
            raise HTTPException(
                status_code=404,
                detail="No indexed resumes found. Please ensure resumes have been uploaded."
            )

        # Get documents from ChromaDB that match this candidate
        if not service.hybrid_matcher.vector_store:
            raise HTTPException(
                status_code=404,
                detail="No indexed resumes found."
            )

        # Search for documents with this candidate_id in metadata
        collection = service.hybrid_matcher.vector_store._collection
        if not collection:
            raise HTTPException(
                status_code=404,
                detail="No indexed resumes found."
            )

        # Get all documents and filter by candidate_id
        # ChromaDB where filter may not work for all cases, so get all and filter
        results = collection.get()

        if not results or 'documents' not in results or len(results['documents']) == 0:
            raise HTTPException(
                status_code=404,
                detail="No indexed resumes found. Please ensure resumes have been uploaded."
            )

        # Debug: Collect all candidate_ids for error message
        all_candidate_ids = set()
        for metadata in results.get('metadatas', []):
            if metadata and 'candidate_id' in metadata:
                all_candidate_ids.add(str(metadata.get('candidate_id')))

        # Find documents with matching candidate_id
        sanitized_parts = []
        filename = None

        for i, doc_text in enumerate(results['documents']):
            metadata = results.get('metadatas', [{}])[
                i] if results.get('metadatas') else {}
            # Check if candidate_id matches (handle both string and any other format)
            candidate_id_in_metadata = metadata.get('candidate_id')
            if candidate_id_in_metadata and str(candidate_id_in_metadata) == str(candidate_id):
                sanitized_parts.append(doc_text)
                if not filename and metadata.get('original_filename'):
                    filename = metadata.get('original_filename')

        if not sanitized_parts:
            # Provide helpful error message with available IDs
            available_ids = ", ".join(list(all_candidate_ids)[
                                      :10]) if all_candidate_ids else "none"
            raise HTTPException(
                status_code=404,
                detail=f"No resume found for candidate {candidate_id}. Available candidate IDs in index: {available_ids}"
            )

        sanitized_content = "\n\n".join(sanitized_parts)

        return SanitizedResumeResponse(
            candidate_id=candidate_id,
            sanitized_content=sanitized_content,
            filename=filename
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving sanitized resume: {str(e)}"
        )


@router.delete("/resume/{candidate_id}", summary="Delete resume data from ChromaDB")
async def delete_resume(candidate_id: str):
    """
    Delete all resume data for a specific candidate from ChromaDB.

    Args:
        candidate_id: Candidate ID (Convex user ID) to delete resume for

    Returns:
        Success message with count of deleted documents
    """
    try:
        service = HybridSearchService()

        # Load existing index
        if not service.load_existing_index():
            raise HTTPException(
                status_code=404,
                detail="No indexed resumes found."
            )

        if not service.hybrid_matcher.vector_store:
            raise HTTPException(
                status_code=404,
                detail="No indexed resumes found."
            )

        collection = service.hybrid_matcher.vector_store._collection
        if not collection:
            raise HTTPException(
                status_code=404,
                detail="No indexed resumes found."
            )

        # Get all documents to find matching candidate_id
        results = collection.get()

        if not results or 'documents' not in results or len(results['documents']) == 0:
            raise HTTPException(
                status_code=404,
                detail="No indexed resumes found."
            )

        # Find all document IDs that match this candidate_id
        ids_to_delete = []
        for i, metadata in enumerate(results.get('metadatas', [])):
            if metadata and metadata.get('candidate_id') == candidate_id:
                # Get the ID for this document
                if 'ids' in results and i < len(results['ids']):
                    ids_to_delete.append(results['ids'][i])

        if not ids_to_delete:
            raise HTTPException(
                status_code=404,
                detail=f"No resume found for candidate {candidate_id}"
            )

        # Delete documents by IDs
        collection.delete(ids=ids_to_delete)

        # Rebuild the retrievers after deletion
        # Get remaining documents
        remaining_results = collection.get()
        if remaining_results and 'documents' in remaining_results and len(remaining_results['documents']) > 0:
            # Recreate documents list for BM25
            remaining_documents = []
            for i, doc_text in enumerate(remaining_results['documents']):
                metadata = remaining_results.get('metadatas', [{}])[
                    i] if remaining_results.get('metadatas') else {}
                from langchain_core.documents import Document
                remaining_documents.append(
                    Document(page_content=doc_text, metadata=metadata)
                )

            # Recreate BM25 retriever
            from langchain_community.retrievers import BM25Retriever
            service.hybrid_matcher.bm25_retriever = BM25Retriever.from_documents(
                remaining_documents)
            service.hybrid_matcher.bm25_retriever.k = 10

            # Recreate ensemble retriever
            vector_retriever = service.hybrid_matcher.vector_store.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 10}
            )
            from langchain.retrievers import EnsembleRetriever
            service.hybrid_matcher.ensemble_retriever = EnsembleRetriever(
                retrievers=[vector_retriever,
                            service.hybrid_matcher.bm25_retriever],
                weights=[service.hybrid_matcher.vector_weight,
                         service.hybrid_matcher.bm25_weight]
            )

            # Update documents list
            service.hybrid_matcher.documents = remaining_documents
        else:
            # No documents left, reset retrievers
            service.hybrid_matcher.bm25_retriever = None
            service.hybrid_matcher.ensemble_retriever = None
            service.hybrid_matcher.documents = []

        return {
            "message": "Resume deleted successfully",
            "deleted_count": len(ids_to_delete),
            "candidate_id": candidate_id
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting resume: {str(e)}"
        )


@router.post("/find-matches", response_model=CandidateMatchResponse, summary="Find matching candidates")
async def find_matching_candidates(request: JobDescriptionRequest):
    """
    Find matching candidates for a job description using AI-powered evaluation.
    Returns one result per candidate with three evaluation scores.

    If job_description_id is provided, results will be saved to Convex.

    Args:
        request: Job description search request

    Returns:
        List of CandidateMatchResult objects - one per candidate with three AI evaluation scores
    """
    try:
        results = await find_matches(
            job_description=request.job_description,
            k=request.k
        )

        # Save results to Convex if job_description_id is provided
        if request.job_description_id:
            try:
                from services.convex_client import ConvexClient
                convex_client = ConvexClient()

                # Convert results to dict format for Convex
                results_dict = [
                    {
                        "candidate_id": r.candidate_id,
                        "scores": {
                            "vector_score": r.scores.vector_score,
                            "bm25_score": r.scores.bm25_score,
                            "hybrid_score": r.scores.hybrid_score,
                        },
                        "report": {
                            "fit_category": r.report.fit_category,
                            "overall_score": r.report.overall_score,
                            "missing_skills": r.report.missing_skills,
                            "explanation": r.report.explanation,
                            "strengths": r.report.strengths,
                            "weaknesses": r.report.weaknesses,
                        } if r.report else None
                    }
                    for r in results
                ]

                await convex_client.save_resume_evaluation(
                    job_description_id=request.job_description_id,
                    job_description_text=request.job_description,
                    results=results_dict,
                    total_candidates=len(results)
                )
            except Exception as save_error:
                # Log error but don't fail the request
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(
                    f"Failed to save resume evaluation to Convex: {save_error}. "
                    "Results are still returned, but not persisted."
                )

        return CandidateMatchResponse(
            results=results,
            query=request.job_description,
            total_candidates=len(results)
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error finding matches: {str(e)}")


@router.get("/debug/candidate-ids", summary="Debug: Get all candidate IDs in index")
async def debug_get_candidate_ids():
    """Debug endpoint to see all candidate IDs in the index."""
    try:
        service = HybridSearchService()

        if not service.load_existing_index():
            return {
                "message": "No index found",
                "candidate_ids": []
            }

        if not service.hybrid_matcher.vector_store:
            return {
                "message": "Vector store not initialized",
                "candidate_ids": []
            }

        collection = service.hybrid_matcher.vector_store._collection
        if not collection:
            return {
                "message": "Collection not found",
                "candidate_ids": []
            }

        results = collection.get()
        candidate_ids = set()
        candidate_metadata = []

        if results and 'metadatas' in results:
            for i, metadata in enumerate(results.get('metadatas', [])):
                if metadata and 'candidate_id' in metadata:
                    candidate_id = str(metadata.get('candidate_id'))
                    candidate_ids.add(candidate_id)
                    candidate_metadata.append({
                        "candidate_id": candidate_id,
                        "filename": metadata.get('original_filename'),
                        "source_type": metadata.get('source_type'),
                    })

        return {
            "message": "Found candidate IDs",
            "total_documents": len(results.get('documents', [])) if results else 0,
            "unique_candidate_ids": list(candidate_ids),
            "candidate_metadata": candidate_metadata
        }

    except Exception as e:
        return {
            "error": str(e),
            "candidate_ids": []
        }


@router.get("/health", summary="Health check for hybrid search service")
async def health_check():
    """Check if hybrid search service is operational."""
    return {
        "status": "healthy",
        "service": "hybrid-search",
        "message": "Hybrid search service is operational"
    }
