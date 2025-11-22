"""
Legacy AI service - kept for backward compatibility.
New implementation is in question_generator.py
"""
from typing import List
from models.question import Question
from services.question_generator import generate_interview_questions as generate_questions_advanced


async def generate_interview_questions(
    job_title: str,
    job_description: str,
    strictness: float = 0.7
) -> List[Question]:
    """
    Generate interview questions using advanced pipeline.
    This is a wrapper for backward compatibility.

    Args:
        job_title: The title of the job
        job_description: The description of the job
        strictness: Domain adaptation parameter (0.0-1.0)

    Returns:
        List of Question objects
    """
    questions, _ = await generate_questions_advanced(
        job_title=job_title,
        job_description=job_description,
        strictness=strictness
    )
    return questions
