"""
API routes for hybrid search functionality.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
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
