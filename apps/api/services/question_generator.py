"""
Advanced interview question generation service with Context Extraction,
Semantic Deduplication, and Structured Output Parsing.
Implements Role Prompting with Constraints and Domain Adaptation.
"""
import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from google import genai
from dotenv import load_dotenv
from models.question import Question

# Load environment variables
load_dotenv()


class QuestionGeneratorAgent:
    """
    AI Agent for generating structured interview questions with:
    - Context Extraction (Hard Skills & Soft Skills)
    - Semantic Deduplication
    - Structured JSON Output
    - Domain Adaptation (Strictness parameter)
    """

    def __init__(self):
        """Initialize the question generator agent."""
        self.model = 'gemini-2.0-flash-001'
        self.client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

    async def extract_context(self, job_description: str) -> Dict[str, Any]:
        """
        Step 1: Extract context from job description.
        Identifies Hard Skills (technical) and Soft Skills (behavioral).
        """
        prompt = f"""Analyze the following job description and extract key competencies.

Job Description:
{job_description}

Extract and categorize:
1. Hard Skills (Technical Skills): Specific technologies, tools, frameworks, programming languages, methodologies
2. Soft Skills (Behavioral Indicators): Problem-solving, communication, teamwork, leadership, adaptability, etc.

Return ONLY a valid JSON object:
{{
    "hard_skills": ["skill1", "skill2", ...],
    "soft_skills": ["skill1", "skill2", ...],
    "domain": "<industry or domain, e.g., 'Finance', 'Healthcare', 'E-commerce'>",
    "complexity_level": "<junior|middle|senior|lead>"
}}"""

        try:
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model,
                contents=prompt
            )

            response_text = response.text.strip()

            # Extract JSON from response
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()

            context = json.loads(response_text)
            return context
        except Exception as e:
            print(f"Error extracting context: {e}")
            return {
                "hard_skills": [],
                "soft_skills": [],
                "domain": "General",
                "complexity_level": "middle"
            }

    async def generate_questions(
        self,
        job_title: str,
        job_description: str,
        context: Dict[str, Any],
        temperature: float = 0.7,
        regenerate: bool = False
    ) -> List[Question]:
        """
        Step 2: Generate structured interview questions using Role Prompting.
        Generates 10-12 balanced questions following the interview scenario structure.
        
        Args:
            job_title: Job title
            job_description: Full job description
            context: Extracted context with hard_skills and soft_skills
            temperature: Model temperature (0.0-1.0). Higher = more creative/varied.
            regenerate: If True, uses higher temperature for more varied questions
        
        Returns:
            List of Question objects with category, difficulty, and expected_keywords
        """
        # If regenerate, increase temperature for more variety
        if regenerate:
            temperature = min(0.85, temperature + 0.15)
        
        hard_skills = context.get("hard_skills", [])
        soft_skills = context.get("soft_skills", [])
        domain = context.get("domain", "General")
        complexity = context.get("complexity_level", "middle")

        # Build role-based prompt with balanced scenario structure
        prompt = f"""You are a Lead Technical Recruiter with 10 years of experience in {domain} industry.
Your task is to analyze the provided job description and create a balanced, structured interview scenario with 10-12 questions.

Job Title: {job_title}
Job Description:
{job_description}

Extracted Context:
- Hard Skills: {', '.join(hard_skills[:15]) if hard_skills else 'Not specified'}
- Soft Skills: {', '.join(soft_skills[:15]) if soft_skills else 'Not specified'}
- Domain: {domain}
- Complexity Level: {complexity}

BALANCED SCENARIO STRUCTURE (Generate 10-12 questions total):

1. ICE-BREAKER (1 question):
   - Category: "intro"
   - Purpose: Warm-up question to establish rapport
   - Example: "Can you describe your experience related to {job_title}?"
   - Should be open-ended and friendly

2. BEHAVIORAL & SOFT SKILLS (4 questions):
   - Categories: "strengths", "weaknesses", "motivation", "culture", "resilience", "achievement"
   - Purpose: Assess behavioral patterns, motivation, and cultural fit
   - Use STAR method where appropriate (Situation, Task, Action, Result)
   - Examples:
     * "What are your greatest professional strengths?"
     * "What do you consider to be your weaknesses?"
     * "Why are you interested in this position?"
     * "How do you handle stress and pressure?"
     * "What is your greatest professional achievement?"

3. HARD SKILLS / CHALLENGES (4 questions):
   - Category: "technical" or "challenge"
   - Purpose: Test technical knowledge and problem-solving
   - Must be specific to technologies mentioned: {', '.join(hard_skills[:10]) if hard_skills else 'relevant technologies'}
   - Should test depth of knowledge, not just surface-level
   - Use STAR method for challenge questions
   - Examples:
     * Technical: "Can you explain how you would optimize a .NET application for high throughput?"
     * Challenge: "Describe a challenge you faced at work and how you handled it."

4. CLOSING (1 question):
   - Category: "closing"
   - Purpose: End the interview on a positive note
   - Example: "Do you have any questions for us?"

REQUIREMENTS:
- Generate 10-12 questions total following the structure above
- All questions must be open-ended (not yes/no)
- Questions must NOT duplicate each other semantically
- Tone: Professional but friendly
- Questions should be specific to the job description and domain
- Use appropriate categories for each question type

Return ONLY a valid JSON array with this exact structure:
[
    {{
        "question_text": "<the actual question>",
        "category": "<intro|strengths|weaknesses|motivation|vision|challenge|culture|resilience|achievement|closing|technical>",
        "expected_keywords": ["keyword1", "keyword2", ...]
    }},
    ...
]

Generate exactly 10-12 questions. expected_keywords should be relevant terms that indicate a good answer."""

        try:
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model,
                contents=prompt
            )

            response_text = response.text.strip()

            # Extract JSON from response
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()

            # Parse JSON
            questions_data = json.loads(response_text)

            # Validate and deduplicate
            questions = self._validate_and_deduplicate(questions_data)
            
            # Ensure we have 10-12 questions
            if len(questions) < 10:
                # Fill missing questions
                questions = self._fill_missing_questions(questions, job_title, hard_skills, soft_skills)
            
            # Convert to Question objects with status "pending"
            question_objects = []
            for i, q_data in enumerate(questions[:12], start=1):  # Limit to 12 max
                question_objects.append(Question(
                    question_text=q_data.get("question_text", ""),
                    category=q_data.get("category", "technical"),
                    difficulty=q_data.get("difficulty"),  # Optional
                    expected_keywords=q_data.get("expected_keywords", []),
                    order=i,
                    status="pending"  # All questions start as pending
                ))
            
            return question_objects

        except json.JSONDecodeError as e:
            print(f"ERROR: Failed to parse JSON from Gemini response: {e}")
            print(f"Response text (first 1000 chars): {response_text[:1000]}")
            return self._get_fallback_questions(job_title)
        except Exception as e:
            print(f"Error generating questions: {str(e)}")
            return self._get_fallback_questions(job_title)

    def _validate_and_deduplicate(self, questions_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Step 3: Semantic deduplication - remove duplicate questions.
        Simple implementation: check for similar question texts.
        """
        if not isinstance(questions_data, list):
            return []

        unique_questions = []
        seen_texts = set()

        for q in questions_data:
            if not isinstance(q, dict):
                continue

            question_text = q.get("question_text", "").strip().lower()

            # Simple deduplication: check if question is too similar to existing ones
            is_duplicate = False
            for seen in seen_texts:
                # Check if questions share more than 70% of words
                words_q = set(question_text.split())
                words_seen = set(seen.split())
                if len(words_q) > 0 and len(words_seen) > 0:
                    similarity = len(words_q.intersection(
                        words_seen)) / max(len(words_q), len(words_seen))
                    if similarity > 0.7:
                        is_duplicate = True
                        break

            if not is_duplicate and question_text:
                unique_questions.append(q)
                seen_texts.add(question_text)

        return unique_questions

    def _get_fallback_questions(self, job_title: str) -> List[Question]:
        """Return fallback questions (10 balanced) if AI generation fails."""
        return [
            Question(
                question_text=f"Can you describe your experience related to {job_title}?",
                category="intro",
                expected_keywords=["experience", "skills", "background"],
                order=1,
                status="pending"
            ),
            Question(
                question_text="What are your greatest professional strengths?",
                category="strengths",
                expected_keywords=["strengths", "skills", "abilities"],
                order=2,
                status="pending"
            ),
            Question(
                question_text="What do you consider to be your weaknesses?",
                category="weaknesses",
                expected_keywords=["weaknesses", "improvement", "growth"],
                order=3,
                status="pending"
            ),
            Question(
                question_text="Why are you interested in this position?",
                category="motivation",
                expected_keywords=["interest", "motivation", "career"],
                order=4,
                status="pending"
            ),
            Question(
                question_text="Where do you see yourself in five years?",
                category="vision",
                expected_keywords=["career", "goals", "future"],
                order=5,
                status="pending"
            ),
            Question(
                question_text="Describe a challenge you faced at work and how you handled it.",
                category="challenge",
                expected_keywords=["challenge", "problem", "solution", "star"],
                order=6,
                status="pending"
            ),
            Question(
                question_text="What is your ideal work environment?",
                category="culture",
                expected_keywords=["environment", "culture", "team"],
                order=7,
                status="pending"
            ),
            Question(
                question_text="How do you handle stress and pressure?",
                category="resilience",
                expected_keywords=["stress", "pressure", "coping"],
                order=8,
                status="pending"
            ),
            Question(
                question_text="What is your greatest professional achievement?",
                category="achievement",
                expected_keywords=["achievement", "success", "accomplishment"],
                order=9,
                status="pending"
            ),
            Question(
                question_text="Do you have any questions for us?",
                category="closing",
                expected_keywords=["questions", "clarification"],
                order=10,
                status="pending"
            )
        ]


async def generate_interview_questions(
    job_title: str,
    job_description: str,
    temperature: float = 0.7,
    regenerate: bool = False
) -> tuple[List[Question], Dict[str, Any]]:
    """
    Main function for generating interview questions with full pipeline:
    1. Context Extraction
    2. Question Generation with Role Prompting (10-12 balanced questions)
    3. Semantic Deduplication
    4. Structured Output Parsing
    
    Args:
        job_title: Job title
        job_description: Full job description
        temperature: Model temperature (0.0-1.0). Higher = more creative/varied.
        regenerate: If True, uses higher temperature for more varied questions
    
    Returns:
        Tuple of (questions list, context analysis)
    """
    generator = QuestionGeneratorAgent()
    
    # Step 1: Extract context
    context = await generator.extract_context(job_description)
    
    # Step 2: Generate questions with deduplication (10-12 questions)
    questions = await generator.generate_questions(
        job_title=job_title,
        job_description=job_description,
        context=context,
        temperature=temperature,
        regenerate=regenerate
    )
    
    return questions, context
