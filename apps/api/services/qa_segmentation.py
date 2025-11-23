"""
Q&A Segmentation Service.
Uses fuzzy string matching to segment conversation transcripts into Question-Answer pairs.
"""
import logging
from typing import List, Dict, Any, Optional, Tuple
from thefuzz import fuzz

logger = logging.getLogger(__name__)


class QASegmentationService:
    """Service for segmenting conversations into Q&A pairs."""

    def __init__(self, similarity_threshold: float = 0.6):
        """
        Initialize Q&A segmentation service.

        Args:
            similarity_threshold: Minimum similarity score (0.0-1.0) to match 
                                 agent utterance to a question
        """
        self.similarity_threshold = similarity_threshold

    def segment_conversation(
        self,
        transcript: Dict[str, Any],
        approved_questions: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Segment conversation transcript into Q&A pairs.

        Args:
            transcript: Transcript data from ElevenLabs with messages and timestamps
            approved_questions: List of approved questions with question_id, question_text, order

        Returns:
            List of Q&A pairs, each containing:
            - question_id: ID of the matched question
            - question_text: The question text
            - answer_text: Candidate's response
            - question_timestamp: When question was asked
            - answer_timestamp: When answer was given
            - order: Question order in interview
        """
        try:
            # Extract messages from transcript
            # ElevenLabs API returns transcript in format:
            # {
            #   "messages": [
            #     {
            #       "role": "user" | "agent",
            #       "message": "text",
            #       "time_in_call_secs": int,
            #       ...
            #     }
            #   ]
            # }
            messages = transcript.get("messages", [])
            if not messages:
                logger.warning("No messages found in transcript")
                return []

            # Build question lookup map for faster matching
            question_map = {
                q["question_text"]: {
                    "question_id": q["question_id"],
                    "order": q.get("order", 0),
                    "expected_keywords": q.get("expected_keywords", [])
                }
                for q in approved_questions
            }

            qa_pairs = []
            current_question = None
            current_answer_parts = []
            answer_start_time = None

            for i, message in enumerate(messages):
                # Use 'role' field from ElevenLabs API response
                role = message.get("role", "").lower()
                # Use 'message' field (or fallback to 'text' for backward compatibility)
                text = message.get("message") or message.get(
                    "text", "").strip()
                # Use 'time_in_call_secs' field from ElevenLabs API
                timestamp = message.get("time_in_call_secs") or message.get(
                    "timestamp") or message.get("created_at")

                if not text:
                    continue

                # Agent messages are questions
                if role == "agent":
                    # If we have a pending answer, save it
                    if current_question and current_answer_parts:
                        qa_pairs.append({
                            "question_id": current_question["question_id"],
                            "question_text": current_question["question_text"],
                            "answer_text": " ".join(current_answer_parts),
                            "question_timestamp": current_question["timestamp"],
                            "answer_timestamp": answer_start_time,
                            "order": current_question["order"],
                            "expected_keywords": current_question.get("expected_keywords", [])
                        })
                        current_answer_parts = []

                    # Try to match this agent message to an approved question
                    matched_question = self._match_question(text, question_map)
                    if matched_question:
                        current_question = {
                            "question_id": matched_question["question_id"],
                            "question_text": text,
                            "timestamp": timestamp,
                            "order": matched_question["order"],
                            "expected_keywords": matched_question.get("expected_keywords", [])
                        }
                        answer_start_time = None

                # User messages are answers
                elif role == "user":
                    if current_question:
                        if not answer_start_time:
                            answer_start_time = timestamp
                        current_answer_parts.append(text)

            # Handle final answer if conversation ended
            if current_question and current_answer_parts:
                qa_pairs.append({
                    "question_id": current_question["question_id"],
                    "question_text": current_question["question_text"],
                    "answer_text": " ".join(current_answer_parts),
                    "question_timestamp": current_question["timestamp"],
                    "answer_timestamp": answer_start_time,
                    "order": current_question["order"],
                    "expected_keywords": current_question.get("expected_keywords", [])
                })

            # Sort by order to ensure correct sequence
            qa_pairs.sort(key=lambda x: x["order"])

            logger.info(
                f"Segmented conversation into {len(qa_pairs)} Q&A pairs "
                f"from {len(messages)} messages"
            )

            return qa_pairs

        except Exception as e:
            logger.error(f"Error segmenting conversation: {e}", exc_info=True)
            return []

    def _match_question(
        self,
        agent_text: str,
        question_map: Dict[str, Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Match agent utterance to an approved question using fuzzy matching.

        Args:
            agent_text: Text from agent/assistant
            question_map: Map of question_text -> question metadata

        Returns:
            Matched question metadata or None
        """
        best_match = None
        best_score = 0.0

        # Normalize agent text (remove common prefixes/suffixes)
        normalized_agent = self._normalize_text(agent_text)

        for question_text, metadata in question_map.items():
            normalized_question = self._normalize_text(question_text)

            # Use token_sort_ratio for better matching of rephrased questions
            score = fuzz.token_sort_ratio(
                normalized_agent, normalized_question) / 100.0

            if score > best_score:
                best_score = score
                best_match = {
                    **metadata,
                    "question_text": question_text
                }

        # Only return match if above threshold
        if best_score >= self.similarity_threshold:
            logger.debug(
                f"Matched agent text '{agent_text[:50]}...' to question "
                f"with score {best_score:.2f}"
            )
            return best_match
        else:
            logger.debug(
                f"No match found for agent text '{agent_text[:50]}...' "
                f"(best score: {best_score:.2f}, threshold: {self.similarity_threshold})"
            )
            return None

    def _normalize_text(self, text: str) -> str:
        """
        Normalize text for better fuzzy matching.

        Args:
            text: Input text

        Returns:
            Normalized text
        """
        # Convert to lowercase, remove extra whitespace
        normalized = " ".join(text.lower().split())

        # Remove common interview phrases that might vary
        # (e.g., "Let me ask you...", "I'd like to know...")
        # This helps match the core question content

        return normalized
