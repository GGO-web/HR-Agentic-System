from fastapi import APIRouter, Depends, HTTPException
from models.question import JobDescription, QuestionResponse
from services.ai_service import generate_interview_questions

router = APIRouter(
    prefix="/questions",
    tags=["questions"],
    responses={404: {"description": "Not found"}},
)


@router.post("/generate", response_model=QuestionResponse)
async def generate_questions(job_description: JobDescription):
    """
    Generate interview questions based on job description.
    """
    try:
        questions = await generate_interview_questions(
            job_title=job_description.title,
            job_description=job_description.description
        )
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
