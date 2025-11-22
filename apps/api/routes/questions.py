from fastapi import APIRouter, Depends, HTTPException
from models.question import JobDescription, QuestionResponse
from services.question_generator import generate_interview_questions

router = APIRouter(
    prefix="/questions",
    tags=["questions"],
    responses={404: {"description": "Not found"}},
)


@router.post("/generate", response_model=QuestionResponse)
async def generate_questions(job_description: JobDescription):
    """
    Generate structured interview questions (10-12) with Context Extraction,
    Semantic Deduplication, and Structured Output Parsing.

    Implements:
    - Balanced scenario structure (Ice-breaker, Behavioral, Hard Skills, Closing)
    - Role Prompting with Constraints
    - Human-in-the-loop ready format (all questions start as "pending")
    """
    try:
        temperature = getattr(job_description, 'temperature', 0.7)
        regenerate = getattr(job_description, 'regenerate', False)

        questions, context_analysis = await generate_interview_questions(
            job_title=job_description.title,
            job_description=job_description.description,
            temperature=temperature,
            regenerate=regenerate
        )

        return QuestionResponse(
            questions=questions,
            context_analysis=context_analysis
        )
    except Exception as e:
        print(f"Error generating questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
