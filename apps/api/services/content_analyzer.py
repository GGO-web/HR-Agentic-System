"""
Content Validity Analysis Service (S_content).
Uses Google Gemini to evaluate answer validity against expected keywords.
"""
import os
import json
import asyncio
import logging
from typing import Dict, Any, List, Optional
from google import genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class ContentAnalyzerAgent:
    """
    AI Agent for analyzing content validity of interview answers.
    Acts as a "Judge" to evaluate if answers contain expected keywords and relevant content.
    """

    def __init__(self):
        """Initialize the content analyzer agent."""
        self.model = 'gemini-2.0-flash-001'
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is required")
        self.client = genai.Client(api_key=api_key)

    async def analyze_content_validity(
        self,
        answer_text: str,
        expected_keywords: List[str],
        question_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze content validity of an answer.

        Args:
            answer_text: The candidate's answer text
            expected_keywords: List of expected keywords/concepts that should be present
            question_text: Optional question text for context

        Returns:
            Dictionary with:
            - score: Float between 0.0 and 1.0
            - reasoning: Explanation of the score
            - keywords_found: List of expected keywords found in answer
            - keywords_missing: List of expected keywords not found
        """
        try:
            # Build prompt for Gemini
            keywords_str = ", ".join(
                expected_keywords) if expected_keywords else "N/A"
            question_context = f"\nQuestion: {question_text}" if question_text else ""

            prompt = f"""You are an expert HR analyst evaluating an interview answer. Your role is to act as a "Judge" and assess whether the candidate's answer demonstrates understanding and relevance.

{question_context}

Expected Keywords/Concepts: {keywords_str}

Candidate's Answer:
{answer_text}

Evaluate the answer based on:
1. **Keyword Presence**: Does the answer mention or demonstrate understanding of the expected keywords/concepts?
2. **Relevance**: Is the answer relevant to the question asked?
3. **Completeness**: Does the answer provide sufficient detail?
4. **Accuracy**: Are the statements factually reasonable (if applicable)?

Return ONLY a valid JSON object with this exact structure:
{{
    "score": <float between 0.0 and 1.0>,
    "reasoning": "<brief explanation of the score, 2-3 sentences>",
    "keywords_found": ["keyword1", "keyword2", ...],
    "keywords_missing": ["keyword1", "keyword2", ...]
}}

Scoring Guidelines:
- 0.9-1.0: Answer demonstrates excellent understanding, mentions most/all keywords, highly relevant
- 0.7-0.89: Answer shows good understanding, mentions many keywords, mostly relevant
- 0.5-0.69: Answer shows moderate understanding, mentions some keywords, somewhat relevant
- 0.3-0.49: Answer shows limited understanding, mentions few keywords, partially relevant
- 0.0-0.29: Answer shows poor understanding, mentions no/minimal keywords, not relevant

Be strict but fair. Base your evaluation on actual content, not assumptions."""

            # Call Gemini API asynchronously
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

                # Validate and normalize score
                score = float(result.get("score", 0.0))
                score = max(0.0, min(1.0, score))  # Clamp to [0.0, 1.0]

                return {
                    "score": score,
                    "reasoning": result.get("reasoning", "No reasoning provided"),
                    "keywords_found": result.get("keywords_found", []),
                    "keywords_missing": result.get("keywords_missing", [])
                }
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Gemini response as JSON: {e}")
                logger.debug(f"Response text: {response_text}")
                # Fallback: try to extract score from text
                return self._get_fallback_score(answer_text, expected_keywords)

        except Exception as e:
            logger.error(
                f"Error analyzing content validity: {e}", exc_info=True)
            return self._get_fallback_score(answer_text, expected_keywords)

    def _get_fallback_score(
        self,
        answer_text: str,
        expected_keywords: List[str]
    ) -> Dict[str, Any]:
        """
        Fallback scoring method if Gemini API fails.
        Uses simple keyword matching.

        Args:
            answer_text: The candidate's answer text
            expected_keywords: List of expected keywords

        Returns:
            Dictionary with fallback score
        """
        if not expected_keywords:
            return {
                "score": 0.5,  # Neutral score if no keywords specified
                "reasoning": "No expected keywords provided for evaluation",
                "keywords_found": [],
                "keywords_missing": []
            }

        answer_lower = answer_text.lower()
        found_keywords = [
            kw for kw in expected_keywords
            if kw.lower() in answer_lower
        ]
        missing_keywords = [
            kw for kw in expected_keywords
            if kw.lower() not in answer_lower
        ]

        # Simple score based on keyword presence ratio
        score = len(found_keywords) / \
            len(expected_keywords) if expected_keywords else 0.0

        return {
            "score": score,
            "reasoning": f"Fallback scoring: {len(found_keywords)}/{len(expected_keywords)} keywords found",
            "keywords_found": found_keywords,
            "keywords_missing": missing_keywords
        }
