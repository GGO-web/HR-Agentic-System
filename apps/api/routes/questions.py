from fastapi import APIRouter, Depends, HTTPException
from models.question import JobDescription, QuestionResponse
from services.ai_service import generate_interview_questions

router = APIRouter(
    prefix="/questions",
    tags=["questions"],
    responses={404: {"description": "Not found"}},
)


@router.post("/generate")
async def generate_questions(job_description: JobDescription):
    print(
        f"title='{job_description.title}' description='{job_description.description}'")
    """
    Generate interview questions based on job description.
    """
    try:
        questions = await generate_interview_questions(
            job_title=job_description.title,
            job_description=job_description.description
        )
        # Convert Question objects to strings for Convex
        question_strings = [q.question for q in questions]

        return {"questions": question_strings}
    except Exception as e:
        print(f"Error generating questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
