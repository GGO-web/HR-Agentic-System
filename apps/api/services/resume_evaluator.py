"""
AI-powered resume evaluation agent using Google Gemini API.
This agent intelligently analyzes resumes against job descriptions and provides three evaluation scores.
"""
import os
import json
import asyncio
from typing import Dict, Optional, Any
from google import genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Google Gemini client
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


class ResumeEvaluatorAgent:
    """
    AI Agent for evaluating resume matches against job descriptions.
    Uses Google Gemini API to intelligently extract and compare:
    1. Technical Skills
    2. Work Experience
    3. Overall Match
    """

    def __init__(self):
        """Initialize the resume evaluator agent."""
        self.model = 'gemini-2.0-flash-001'
        self.client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

    async def evaluate_resume(
        self,
        job_description: str,
        resume_content: str,
        semantic_similarity: float = 0.0,
        position_rank: int = 0,
        total_results: int = 1
    ) -> Dict[str, Any]:
        """
        Evaluate resume against job description using AI agent.

        Args:
            job_description: Job description text
            resume_content: Resume content text (sanitized)
            semantic_similarity: Semantic similarity score from vector search (0.0-1.0)
            position_rank: Position in search results (0-based)
            total_results: Total number of results

        Returns:
            Dictionary with three scores: technical_skills, experience, overall_match
        """
        try:
            # Create structured prompt for Gemini
            prompt = f"""You are an expert HR evaluation agent. Analyze the resume against the job description and provide three evaluation scores (0.0 to 1.0).

Job Description:
{job_description}

Resume Content:
{resume_content}

Analyze and provide scores for:

1. **Technical Skills Match (0.0-1.0)**: 
   - Extract all technical skills, technologies, tools, frameworks, and programming languages mentioned in the job description
   - Compare with technical skills mentioned in the resume
   - Consider: programming languages, frameworks, databases, cloud platforms, tools, methodologies
   - Score based on: coverage of required skills, relevance, and depth of expertise mentioned

2. **Experience Match (0.0-1.0)**:
   - Extract required years of experience, job level (junior/senior/lead), and responsibilities from job description
   - Compare with candidate's work experience, years of experience, job titles, and responsibilities in resume
   - Consider: years of experience, job titles, level of responsibility, industry experience
   - Score based on: years match, role level match, and relevance of experience

3. **Overall Match (0.0-1.0)**:
   - Evaluate overall semantic and contextual fit between resume and job description
   - Consider: alignment of career path, industry fit, cultural fit indicators, soft skills mentioned
   - This is a holistic assessment of how well the candidate fits the role beyond just technical skills
   - Score based on: overall fit, career progression alignment, and potential for success in the role

Return ONLY a valid JSON object with this exact structure:
{{
    "technical_skills": <float between 0.0 and 1.0>,
    "experience": <float between 0.0 and 1.0>,
    "overall_match": <float between 0.0 and 1.0>,
    "reasoning": {{
        "technical_skills": "<brief explanation of technical skills score>",
        "experience": "<brief explanation of experience score>",
        "overall_match": "<brief explanation of overall match score>"
    }}
}}

Be precise and analytical. Base scores on actual content comparison, not assumptions."""

            # Call Gemini API asynchronously
            # Use basic call without temperature/max_output_tokens (model will use defaults)
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model,
                contents=prompt
            )

            # Parse JSON response
            response_text = response.text.strip()

            # Try to extract JSON from response (might have markdown code blocks)
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()

            # Parse JSON
            try:
                result = json.loads(response_text)

                # Extract scores
                technical_skills = float(result.get("technical_skills", 0.5))
                experience = float(result.get("experience", 0.5))
                overall_match = float(result.get("overall_match", 0.5))

                # Normalize scores to 0.0-1.0 range
                technical_skills = max(0.0, min(1.0, technical_skills))
                experience = max(0.0, min(1.0, experience))
                overall_match = max(0.0, min(1.0, overall_match))

                # Extract reasoning if available
                reasoning_data = result.get("reasoning", {})
                reasoning = {
                    'technical_skills': reasoning_data.get("technical_skills", "No explanation provided"),
                    'experience': reasoning_data.get("experience", "No explanation provided"),
                    'overall_match': reasoning_data.get("overall_match", "No explanation provided")
                }

                return {
                    'technical_skills': round(technical_skills, 3),
                    'experience': round(experience, 3),
                    'overall_match': round(overall_match, 3),
                    'reasoning': reasoning
                }

            except json.JSONDecodeError as e:
                print(f"ERROR: Failed to parse JSON from Gemini response: {e}")
                print(
                    f"Response text (first 1000 chars): {response_text[:1000]}")
                print(f"Full response length: {len(response_text)}")
                # Fallback to default scores
                return self._get_fallback_scores()

        except Exception as e:
            print(f"Error in ResumeEvaluatorAgent: {str(e)}")
            # Fallback to default scores if AI fails
            return self._get_fallback_scores()

    def _get_fallback_scores(self) -> Dict[str, Any]:
        """Return neutral fallback scores if AI evaluation fails."""
        return {
            'technical_skills': 0.5,
            'experience': 0.5,
            'overall_match': 0.5,
            'reasoning': {
                'technical_skills': 'AI evaluation failed. Using default score.',
                'experience': 'AI evaluation failed. Using default score.',
                'overall_match': 'AI evaluation failed. Using default score.'
            }
        }

    async def generate_analysis_report(
        self,
        job_description: str,
        resume_content: str,
        hybrid_score: float
    ) -> Dict[str, Any]:
        """
        Generate detailed analysis report with explainability using Chain-of-Thought approach.

        Args:
            job_description: Job description text
            resume_content: Resume content text (sanitized)
            hybrid_score: Calculated hybrid search score (0.0-1.0)

        Returns:
            Dictionary with analysis report: fit_category, overall_score, missing_skills, explanation, strengths, weaknesses
        """
        try:
            # Create Chain-of-Thought prompt for analysis
            prompt = f"""You are an expert HR analyst. Analyze the candidate's resume against the job description and provide a detailed analysis report.

Job Description:
{job_description}

Resume Content:
{resume_content}

Hybrid Search Score: {hybrid_score:.3f} (0.0-1.0)

Perform analysis in two steps:

**Step 1: Gap Analysis**
- Compare the candidate's skills, experience, and qualifications with the job requirements
- Identify missing skills, technologies, or qualifications
- Identify candidate's strengths that match the job requirements

**Step 2: Scoring & Reasoning**
- Determine the overall fit category: "Excellent" (80-100), "Good" (60-79), "Fair" (40-59), or "Poor" (0-39)
- Calculate an overall score (0-100) based on the hybrid score and your analysis
- Provide a detailed explanation of why this score was assigned
- List specific strengths and weaknesses

Return ONLY a valid JSON object with this exact structure:
{{
    "fit_category": "<Excellent|Good|Fair|Poor>",
    "overall_score": <integer between 0 and 100>,
    "missing_skills": ["skill1", "skill2", ...],
    "explanation": "<detailed explanation of the match analysis, 2-3 sentences>",
    "strengths": ["strength1", "strength2", ...],
    "weaknesses": ["weakness1", "weakness2", ...]
}}

Be specific and analytical. Base your analysis on actual content comparison."""

            # Call Gemini API
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model,
                contents=prompt
            )

            # Parse JSON response
            response_text = response.text.strip()

            # Try to extract JSON from response (might have markdown code blocks)
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()

            # Parse JSON
            try:
                result = json.loads(response_text)

                # Validate and normalize
                fit_category = result.get("fit_category", "Fair")
                if fit_category not in ["Excellent", "Good", "Fair", "Poor"]:
                    fit_category = "Fair"

                overall_score = int(result.get("overall_score", 50))
                overall_score = max(0, min(100, overall_score))

                missing_skills = result.get("missing_skills", [])
                if not isinstance(missing_skills, list):
                    missing_skills = []

                explanation = result.get(
                    "explanation", "No explanation provided.")

                strengths = result.get("strengths", [])
                if not isinstance(strengths, list):
                    strengths = []

                weaknesses = result.get("weaknesses", [])
                if not isinstance(weaknesses, list):
                    weaknesses = []

                return {
                    'fit_category': fit_category,
                    'overall_score': overall_score,
                    'missing_skills': missing_skills,
                    'explanation': explanation,
                    'strengths': strengths,
                    'weaknesses': weaknesses
                }

            except json.JSONDecodeError as e:
                print(
                    f"ERROR: Failed to parse JSON from Gemini analysis report: {e}")
                print(
                    f"Response text (first 1000 chars): {response_text[:1000]}")
                return self._get_fallback_report()

        except Exception as e:
            print(f"Error in generate_analysis_report: {str(e)}")
            return self._get_fallback_report()

    def _get_fallback_report(self) -> Dict[str, Any]:
        """Return fallback report if AI generation fails."""
        return {
            'fit_category': 'Fair',
            'overall_score': 50,
            'missing_skills': [],
            'explanation': 'AI analysis failed. Unable to generate detailed report.',
            'strengths': [],
            'weaknesses': []
        }


# Backward compatibility alias
ResumeEvaluator = ResumeEvaluatorAgent
