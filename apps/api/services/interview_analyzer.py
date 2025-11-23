"""
Interview Analysis Orchestrator.
Coordinates the full analysis pipeline: download → segment → analyze → score.
Returns results to be stored by the frontend.
"""
import os
import logging
import asyncio
from typing import Dict, Any, Optional, List
from services.elevenlabs_service import ElevenLabsService
from services.qa_segmentation import QASegmentationService
from services.content_analyzer import ContentAnalyzerAgent
from services.confidence_analyzer import ConfidenceAnalyzerService
from services.interview_scorer import InterviewScorer

logger = logging.getLogger(__name__)


class InterviewAnalyzer:
    """Orchestrates the complete interview analysis pipeline."""

    def __init__(self):
        """Initialize interview analyzer with all required services."""
        self.elevenlabs_service = ElevenLabsService()
        self.qa_segmentation = QASegmentationService(similarity_threshold=0.6)
        self.content_analyzer = ContentAnalyzerAgent()
        self.confidence_analyzer = ConfidenceAnalyzerService()
        self.scorer = InterviewScorer(content_threshold=0.4)

    async def analyze_interview(
        self,
        conversation_id: str,
        approved_questions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Run complete analysis pipeline for an interview.

        Pipeline:
        1. Download transcript and audio from ElevenLabs
        2. Segment conversation into Q&A pairs using provided questions
        3. For each Q&A pair:
           - Run content analysis (parallel with confidence)
           - Run confidence analysis (parallel with content)
           - Calculate final score
        4. Return results (frontend will store in Convex)

        Args:
            conversation_id: ElevenLabs conversation ID
            approved_questions: List of approved questions with structure:
                {
                    "question_id": str (Convex ID),
                    "question_text": str,
                    "order": int,
                    "expected_keywords": List[str]
                }

        Returns:
            Dictionary with analysis results ready to be stored in Convex
        """
        try:
            logger.info(
                f"Starting analysis pipeline for conversation_id={conversation_id}, "
                f"questions_count={len(approved_questions)}"
            )

            if not approved_questions:
                raise ValueError("No approved questions provided")

            # Step 1: Download transcript and audio from ElevenLabs
            logger.info(
                "Step 1: Downloading transcript and audio from ElevenLabs...")
            transcript_task = asyncio.create_task(
                self.elevenlabs_service.download_transcript(conversation_id)
            )
            audio_task = asyncio.create_task(
                self.elevenlabs_service.download_audio(conversation_id)
            )

            transcript, audio_bytes = await asyncio.gather(transcript_task, audio_task)

            if not transcript:
                raise ValueError(
                    "Failed to download transcript from ElevenLabs")

            if not audio_bytes:
                logger.warning(
                    "Failed to download audio, continuing with transcript-only analysis")

            # Step 2: Segment conversation into Q&A pairs
            logger.info("Step 2: Segmenting conversation into Q&A pairs...")
            qa_pairs = self.qa_segmentation.segment_conversation(
                transcript=transcript,
                approved_questions=approved_questions
            )

            if not qa_pairs:
                logger.warning("No Q&A pairs found in conversation")
                return {
                    "status": "warning",
                    "message": "No Q&A pairs found in conversation",
                    "conversation_id": conversation_id
                }

            logger.info(f"Found {len(qa_pairs)} Q&A pairs to analyze")

            # Step 4: Analyze each Q&A pair
            logger.info("Step 4: Analyzing Q&A pairs...")
            analysis_results = []

            for i, qa_pair in enumerate(qa_pairs):
                logger.info(
                    f"Analyzing Q&A pair {i+1}/{len(qa_pairs)}: "
                    f"question_id={qa_pair['question_id']}"
                )

                try:
                    # Run content and confidence analysis in parallel
                    content_task = asyncio.create_task(
                        self.content_analyzer.analyze_content_validity(
                            answer_text=qa_pair["answer_text"],
                            expected_keywords=qa_pair.get(
                                "expected_keywords", []),
                            question_text=qa_pair.get("question_text")
                        )
                    )

                    # For confidence analysis, we need audio segment
                    # For now, use full audio (in production, extract segment by timestamp)
                    # If audio_bytes is None, pass None to use transcript-only analysis
                    confidence_task = asyncio.create_task(
                        self.confidence_analyzer.analyze_confidence(
                            audio_bytes=audio_bytes,
                            transcript=qa_pair["answer_text"],
                            audio_format="mp3"
                        )
                    )

                    content_result, confidence_result = await asyncio.gather(
                        content_task,
                        confidence_task
                    )

                    # Calculate final score
                    final_score = self.scorer.calculate_final_score(
                        content_score=content_result["score"],
                        confidence_score=confidence_result["score"]
                    )

                    # Prepare result for frontend to store in Convex
                    # Note: audio_url should be extracted from ElevenLabs or stored separately
                    # For now, we'll use a placeholder or the full conversation audio
                    audio_url = f"elevenlabs://conversations/{conversation_id}"

                    analysis_results.append({
                        "question_id": qa_pair["question_id"],
                        "audio_url": audio_url,
                        "transcription": qa_pair["answer_text"],
                        "content_score": content_result["score"],
                        "confidence_score": confidence_result["score"],
                        "final_score": final_score,
                        "content_analysis": {
                            "reasoning": content_result.get("reasoning", ""),
                            "keywords_found": content_result.get("keywords_found", []),
                            "keywords_missing": content_result.get("keywords_missing", [])
                        },
                        "confidence_analysis": {
                            "reasoning": confidence_result.get("reasoning", ""),
                            "metrics": confidence_result.get("metrics", {})
                        }
                    })

                except Exception as e:
                    logger.error(
                        f"Error analyzing Q&A pair {i+1}: {e}",
                        exc_info=True
                    )
                    analysis_results.append({
                        "question_id": qa_pair["question_id"],
                        "error": str(e)
                    })

            # Summary
            successful_analyses = [
                r for r in analysis_results if "error" not in r]
            failed_analyses = [r for r in analysis_results if "error" in r]

            logger.info(
                f"Analysis complete: {len(successful_analyses)} successful, "
                f"{len(failed_analyses)} failed"
            )

            return {
                "status": "success",
                "conversation_id": conversation_id,
                "qa_pairs_analyzed": len(qa_pairs),
                "successful_analyses": len(successful_analyses),
                "failed_analyses": len(failed_analyses),
                "results": analysis_results
            }

        except Exception as e:
            logger.error(
                f"Error in analysis pipeline: {e}",
                exc_info=True
            )
            return {
                "status": "error",
                "conversation_id": conversation_id,
                "error": str(e)
            }
