import os
from typing import List
from google import genai
from models.question import Question
from dotenv import load_dotenv
import asyncio

# Load environment variables
load_dotenv()

# Initialize Google Gemini client
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


async def generate_interview_questions(job_title: str, job_description: str) -> List[Question]:
    """
    Generate interview questions using Google's Gemini API based on job description.

    Args:
        job_title: The title of the job
        job_description: The description of the job

    Returns:
        List of Question objects
    """
    try:
        # Create prompt for Gemini
        prompt = f"""
        As an expert HR professional, generate 10 interview questions for the position of {job_title}.
        
        Job Description:
        {job_description}
        
        Generate 10 specific, tailored questions that will help assess candidates for this role.
        The questions should cover technical skills, experience, behavioral aspects, and cultural fit.
        
        Format the output as a numbered list of questions only, with no additional text.
        """

        # Call Gemini API asynchronously
        model = 'gemini-2.0-flash-001'

        # Since the Google Gemini API doesn't have native async support,
        # we'll run it in a thread pool to make it non-blocking
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=model,
            contents=prompt,
            temperature=0.7,
            max_output_tokens=1500
        )

        # Process the response
        questions_text = response.text.strip()

        # Parse the questions
        questions_list = []
        for i, line in enumerate(questions_text.split('\n')):
            # Skip empty lines
            if not line.strip():
                continue

            # Clean up the line (remove numbers, etc.)
            clean_line = line.strip()
            # Remove leading numbers like "1. ", "2. ", etc.
            if clean_line and clean_line[0].isdigit() and ". " in clean_line[:5]:
                clean_line = clean_line[clean_line.find(". ") + 2:]

            # Create Question object
            if len(questions_list) < 10:  # Ensure we only get 10 questions
                questions_list.append(
                    Question(
                        question=clean_line.strip(),
                        order=i + 1
                    )
                )

        return questions_list

    except Exception as e:
        # If Gemini API fails, return placeholder questions
        print(f"Error generating questions with Gemini: {str(e)}")
        return generate_fallback_questions(job_title)


def generate_fallback_questions(job_title: str) -> List[Question]:
    """Generate fallback questions if Gemini API fails"""

    fallback_questions = [
        f"Can you describe your experience related to {job_title}?",
        "What are your greatest professional strengths?",
        "What do you consider to be your weaknesses?",
        "Why are you interested in this position?",
        "Where do you see yourself in five years?",
        "Describe a challenge you faced at work and how you handled it.",
        "What is your ideal work environment?",
        "How do you handle stress and pressure?",
        "What is your greatest professional achievement?",
        "Do you have any questions for us?"
    ]

    return [
        Question(question=q, order=i+1)
        for i, q in enumerate(fallback_questions)
    ]
