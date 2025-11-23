"""
Convex HTTP API client for saving resume evaluation results.
Uses Convex HTTP API to store data from Python backend.
"""
import os
import httpx
import logging
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class ConvexClient:
    """Client for interacting with Convex HTTP API."""

    def __init__(self):
        """Initialize Convex client with deployment URL."""
        self.deployment_url = os.getenv("CONVEX_DEPLOYMENT_URL")
        if not self.deployment_url:
            raise ValueError(
                "CONVEX_DEPLOYMENT_URL environment variable is required"
            )

        # Remove trailing slash if present
        self.deployment_url = self.deployment_url.rstrip("/")
        self.base_url = f"{self.deployment_url}/api/mutation"

    async def save_resume_evaluation(
        self,
        job_description_id: str,
        job_description_text: str,
        results: List[Dict[str, Any]],
        total_candidates: int
    ) -> bool:
        """
        Save resume evaluation results to Convex.

        Args:
            job_description_id: Convex job description ID
            job_description_text: Full job description text
            results: List of candidate match results
            total_candidates: Total number of candidates evaluated

        Returns:
            True if successful, False otherwise
        """
        try:
            # Format results for Convex mutation
            formatted_results = []
            for result in results:
                formatted_result = {
                    "candidate_id": result.get("candidate_id", ""),
                    "scores": {
                        "vector_score": result.get("scores", {}).get("vector_score", 0.0),
                        "bm25_score": result.get("scores", {}).get("bm25_score", 0.0),
                        "hybrid_score": result.get("scores", {}).get("hybrid_score", 0.0),
                    }
                }

                # Add report if present
                if result.get("report"):
                    report = result["report"]
                    formatted_result["report"] = {
                        "fit_category": report.get("fit_category", ""),
                        "overall_score": report.get("overall_score", 0),
                        "missing_skills": report.get("missing_skills", []),
                        "explanation": report.get("explanation", ""),
                        "strengths": report.get("strengths", []),
                        "weaknesses": report.get("weaknesses", []),
                    }

                formatted_results.append(formatted_result)

            # Prepare mutation payload for Convex HTTP API
            # Format: POST {deployment}/api/mutation/{function_path}
            mutation_path = "resumeEvaluations:createOrUpdate"
            mutation_url = f"{self.deployment_url}/api/mutation/{mutation_path}"

            payload = {
                "jobDescriptionId": job_description_id,
                "jobDescriptionText": job_description_text,
                "results": formatted_results,
                "totalCandidates": total_candidates,
            }

            # Call Convex HTTP API
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    mutation_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )

                if response.status_code == 200:
                    logger.info(
                        f"Successfully saved resume evaluation for job_description_id={job_description_id}"
                    )
                    return True
                else:
                    logger.error(
                        f"Failed to save resume evaluation: HTTP {response.status_code}, "
                        f"response: {response.text}"
                    )
                    return False

        except Exception as e:
            logger.error(
                f"Error saving resume evaluation to Convex: {e}",
                exc_info=True
            )
            return False
