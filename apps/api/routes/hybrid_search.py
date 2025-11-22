"""
API routes for hybrid search functionality.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Optional
from pydantic import BaseModel, Field

from services.hybrid_search_service import HybridSearchService, process_resume, find_matches
from models.hybrid_search import SearchResult

router = APIRouter(prefix="/hybrid-search", tags=["hybrid-search"])


class JobDescriptionRequest(BaseModel):
    """Request model for job description search."""
    job_description: str = Field(...,
                                 description="Job description text to search against")
    k: int = Field(default=5, ge=1, le=20,
                   description="Number of results to return")
    search_type: str = Field(
        default="hybrid", description="Search type: hybrid, vector, or keyword")


class SearchResponse(BaseModel):
    """Response model for search results."""
    results: List[SearchResult]
    query: str
    search_type: str
    k: int


@router.post("/process-resume", summary="Process a resume file")
async def process_resume_file(
    file: UploadFile = File(..., description="Resume file (PDF or DOCX)"),
    candidate_id: Optional[str] = None
):
    """
    Process a resume file through the ETL pipeline.

    Pipeline: Load Document -> Sanitize (PII Removal) -> Chunking -> Vectorization -> Hybrid Indexing

    Args:
        file: Uploaded resume file
        candidate_id: Optional candidate ID for metadata

    Returns:
        Success message with document count
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

            return {
                "message": "Resume processed successfully",
                "document_count": len(documents),
                "filename": file.filename
            }
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing resume: {str(e)}")


@router.post("/find-matches", response_model=SearchResponse, summary="Find matching resume chunks")
async def find_matching_chunks(request: JobDescriptionRequest):
    """
    Find matching resume chunks for a job description using hybrid search.

    Args:
        request: Job description search request

    Returns:
        List of matching SearchResult objects
    """
    try:
        if request.search_type not in ["hybrid", "vector", "keyword"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid search_type. Must be 'hybrid', 'vector', or 'keyword'"
            )

        results = await find_matches(
            job_description=request.job_description,
            k=request.k,
            search_type=request.search_type
        )

        return SearchResponse(
            results=results,
            query=request.job_description,
            search_type=request.search_type,
            k=request.k
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error finding matches: {str(e)}")


@router.get("/health", summary="Health check for hybrid search service")
async def health_check():
    """Check if hybrid search service is operational."""
    return {
        "status": "healthy",
        "service": "hybrid-search",
        "message": "Hybrid search service is operational"
    }
