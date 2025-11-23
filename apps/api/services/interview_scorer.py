"""
Interview Scoring Service.
Implements threshold logic for calculating final scores from content and confidence metrics.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class InterviewScorer:
    """Service for calculating final interview scores with threshold protection."""

    def __init__(self, content_threshold: float = 0.4, alpha: float = 0.8):
        """
        Initialize interview scorer.

        Args:
            content_threshold: Minimum content score (S_content) required 
                             to allow confidence scoring (default: 0.4)
            alpha: Weight for content score in final calculation (default: 0.8)
                   Final score = alpha * S_content + (1 - alpha) * S_confidence
        """
        self.content_threshold = content_threshold
        self.alpha = alpha

    def calculate_final_score(
        self,
        content_score: float,
        confidence_score: float,
        alpha: Optional[float] = None
    ) -> float:
        """
        Calculate final score using threshold logic.

        Formula:
        - If S_content < threshold: Score = 0.0
        - Else: Score = alpha * S_content + (1 - alpha) * S_confidence

        This ensures that candidates who answer incorrectly (low content score)
        cannot get points for confidence alone.

        Args:
            content_score: Content validity score (0.0-1.0)
            confidence_score: Confidence score (0.0-1.0)
            alpha: Optional weight for content score (default: uses instance alpha)
                   If provided, overrides instance alpha for this calculation

        Returns:
            Final score (0.0-1.0)
        """
        # Validate inputs
        content_score = max(0.0, min(1.0, float(content_score)))
        confidence_score = max(0.0, min(1.0, float(confidence_score)))

        # Use provided alpha or instance alpha
        weight = alpha if alpha is not None else self.alpha
        weight = max(0.0, min(1.0, weight))  # Clamp alpha to [0.0, 1.0]

        # Apply threshold logic
        if content_score < self.content_threshold:
            logger.debug(
                f"Content score {content_score:.2f} below threshold "
                f"{self.content_threshold}, returning 0.0"
            )
            return 0.0

        # Calculate weighted score
        final_score = weight * content_score + \
            (1.0 - weight) * confidence_score

        logger.debug(
            f"Final score: {final_score:.2f} "
            f"(content: {content_score:.2f}, confidence: {confidence_score:.2f}, "
            f"alpha: {weight:.2f})"
        )

        return max(0.0, min(1.0, final_score))  # Ensure within bounds

    def validate_scores(
        self,
        content_score: Optional[float],
        confidence_score: Optional[float]
    ) -> tuple[bool, Optional[str]]:
        """
        Validate that scores are within acceptable ranges.

        Args:
            content_score: Content validity score
            confidence_score: Confidence score

        Returns:
            Tuple of (is_valid, error_message)
        """
        if content_score is None:
            return False, "Content score is required"

        if confidence_score is None:
            return False, "Confidence score is required"

        if not (0.0 <= content_score <= 1.0):
            return False, f"Content score must be between 0.0 and 1.0, got {content_score}"

        if not (0.0 <= confidence_score <= 1.0):
            return False, f"Confidence score must be between 0.0 and 1.0, got {confidence_score}"

        return True, None
