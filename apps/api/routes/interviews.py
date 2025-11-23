"""
Interview analysis endpoints.
Handles interview analysis requests from frontend.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging

from services.interview_analyzer import InterviewAnalyzer

router = APIRouter(
    prefix="/interviews",
    tags=["interviews"],
    responses={404: {"description": "Not found"}},
)

logger = logging.getLogger(__name__)


class QuestionInput(BaseModel):
    """Question input model for analysis."""
    question_id: str
    question_text: str
    order: int
    expected_keywords: Optional[List[str]] = []


class AnalyzeInterviewRequest(BaseModel):
    """Request model for interview analysis."""
    conversation_id: str
    questions: List[QuestionInput]


@router.post("/analyze")
async def analyze_interview(request: AnalyzeInterviewRequest):
    """
    Analyze an interview conversation.

    This endpoint:
    1. Downloads transcript and audio from ElevenLabs
    2. Segments conversation into Q&A pairs
    3. Analyzes each Q&A pair (content validity + confidence)
    4. Calculates final scores
    5. Returns results for frontend to store in Convex

    Args:
        request: AnalyzeInterviewRequest with conversation_id and questions

    Returns:
        Analysis results ready to be stored in Convex
    """
    try:
        logger.info(
            f"Starting interview analysis for conversation_id={request.conversation_id}, "
            f"questions_count={len(request.questions)}"
        )

        # Format questions for analyzer
        formatted_questions = [
            {
                "question_id": q.question_id,
                "question_text": q.question_text,
                "order": q.order,
                "expected_keywords": q.expected_keywords or []
            }
            for q in request.questions
        ]

        # Initialize analyzer and run analysis
        analyzer = InterviewAnalyzer()
        results = await analyzer.analyze_interview(
            conversation_id=request.conversation_id,
            approved_questions=formatted_questions
        )

        if results["status"] == "error":
            raise HTTPException(
                status_code=500,
                detail=results.get("error", "Analysis failed")
            )

        logger.info(
            f"Analysis complete for conversation_id={request.conversation_id}: "
            f"{results['successful_analyses']} successful, {results['failed_analyses']} failed"
        )

        return results

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Error in analyze_interview endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
