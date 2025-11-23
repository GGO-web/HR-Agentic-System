"""
Confidence Analysis Service (S_confidence).
Analyzes audio for psycholinguistic parameters to assess candidate confidence.
"""
import os
import io
import logging
import numpy as np
from typing import Dict, Any, Optional
import librosa
from pydub import AudioSegment

logger = logging.getLogger(__name__)


class ConfidenceAnalyzerService:
    """
    Service for analyzing audio to determine confidence score.
    Analyzes speech rate, pauses, filler words, and voice stability.
    """

    def __init__(self):
        """Initialize confidence analyzer service."""
        # Normal ranges for confident speech (can be tuned)
        self.optimal_speech_rate = 150  # words per minute
        self.speech_rate_tolerance = 30  # acceptable deviation

        # Filler words that indicate uncertainty
        self.filler_words = [
            "um", "uh", "er", "ah", "like", "you know",
            "well", "so", "actually", "basically"
        ]

    async def analyze_confidence(
        self,
        audio_bytes: Optional[bytes],
        transcript: Optional[str] = None,
        audio_format: str = "mp3"
    ) -> Dict[str, Any]:
        """
        Analyze audio to determine confidence score.

        Args:
            audio_bytes: Audio file as bytes
            transcript: Optional transcript text for filler word detection
            audio_format: Audio format (mp3, wav, etc.)

        Returns:
            Dictionary with:
            - score: Float between 0.0 and 1.0
            - reasoning: Explanation of the score
            - metrics: Detailed metrics (speech_rate, pause_count, etc.)
        """
        try:
            # If no audio provided, use transcript-only analysis
            if not audio_bytes:
                logger.info(
                    "No audio provided, using transcript-only analysis")
                return self._analyze_transcript_only(transcript)

            # Load audio using librosa
            audio_data, sample_rate = self._load_audio(
                audio_bytes, audio_format)

            if audio_data is None:
                logger.warning(
                    "Failed to load audio, using transcript-only analysis")
                return self._analyze_transcript_only(transcript)

            # Analyze various confidence indicators
            speech_rate = self._calculate_speech_rate(
                audio_data, sample_rate, transcript)
            pause_metrics = self._analyze_pauses(audio_data, sample_rate)
            pitch_stability = self._analyze_pitch_stability(
                audio_data, sample_rate)
            filler_word_count = self._count_filler_words(
                transcript) if transcript else 0

            # Calculate confidence score from metrics
            score = self._calculate_confidence_score(
                speech_rate=speech_rate,
                pause_metrics=pause_metrics,
                pitch_stability=pitch_stability,
                filler_word_count=filler_word_count,
                transcript_length=len(transcript.split()) if transcript else 0
            )

            return {
                "score": score,
                "reasoning": self._generate_reasoning(
                    speech_rate, pause_metrics, pitch_stability, filler_word_count
                ),
                "metrics": {
                    "speech_rate_wpm": speech_rate,
                    "pause_count": pause_metrics["count"],
                    "average_pause_duration": pause_metrics["avg_duration"],
                    "pitch_stability": pitch_stability,
                    "filler_word_count": filler_word_count
                }
            }

        except Exception as e:
            logger.error(f"Error analyzing confidence: {e}", exc_info=True)
            # Fallback to transcript-only if audio analysis fails
            return self._analyze_transcript_only(transcript)

    def _load_audio(
        self,
        audio_bytes: bytes,
        audio_format: str
    ) -> tuple[Optional[np.ndarray], Optional[int]]:
        """
        Load audio from bytes using librosa.

        Args:
            audio_bytes: Audio file as bytes
            audio_format: Audio format

        Returns:
            Tuple of (audio_data, sample_rate) or (None, None) if failed
        """
        try:
            # Convert bytes to file-like object
            audio_file = io.BytesIO(audio_bytes)

            # Load with librosa (handles resampling automatically)
            audio_data, sample_rate = librosa.load(
                audio_file,
                sr=None,  # Keep original sample rate
                mono=True  # Convert to mono if stereo
            )

            return audio_data, sample_rate

        except Exception as e:
            logger.error(f"Error loading audio: {e}", exc_info=True)
            return None, None

    def _calculate_speech_rate(
        self,
        audio_data: np.ndarray,
        sample_rate: int,
        transcript: Optional[str]
    ) -> float:
        """
        Calculate speech rate in words per minute.

        Args:
            audio_data: Audio waveform
            sample_rate: Sample rate
            transcript: Optional transcript for word count

        Returns:
            Speech rate in words per minute
        """
        if transcript:
            # Use transcript for accurate word count
            word_count = len(transcript.split())
            duration_seconds = len(audio_data) / sample_rate
            if duration_seconds > 0:
                return (word_count / duration_seconds) * 60
        else:
            # Estimate from audio duration (less accurate)
            duration_seconds = len(audio_data) / sample_rate
            # Rough estimate: average speaker says ~2 words per second
            estimated_words = duration_seconds * 2
            return (estimated_words / duration_seconds) * 60 if duration_seconds > 0 else 0

        return 0.0

    def _analyze_pauses(
        self,
        audio_data: np.ndarray,
        sample_rate: int,
        silence_threshold: float = 0.02
    ) -> Dict[str, Any]:
        """
        Analyze pauses in speech.

        Args:
            audio_data: Audio waveform
            sample_rate: Sample rate
            silence_threshold: Amplitude threshold for silence (0.0-1.0)

        Returns:
            Dictionary with pause metrics
        """
        # Calculate energy (RMS)
        frame_length = 2048
        hop_length = 512
        rms = librosa.feature.rms(
            y=audio_data,
            frame_length=frame_length,
            hop_length=hop_length
        )[0]

        # Identify silence frames
        silence_frames = rms < silence_threshold

        # Find pause segments (consecutive silence frames)
        pause_segments = []
        in_pause = False
        pause_start = 0

        for i, is_silent in enumerate(silence_frames):
            if is_silent and not in_pause:
                pause_start = i
                in_pause = True
            elif not is_silent and in_pause:
                pause_duration = (i - pause_start) * hop_length / sample_rate
                if pause_duration > 0.3:  # Only count pauses > 300ms
                    pause_segments.append(pause_duration)
                in_pause = False

        # Handle pause at end
        if in_pause:
            pause_duration = (len(silence_frames) -
                              pause_start) * hop_length / sample_rate
            if pause_duration > 0.3:
                pause_segments.append(pause_duration)

        return {
            "count": len(pause_segments),
            "avg_duration": np.mean(pause_segments) if pause_segments else 0.0,
            "total_duration": sum(pause_segments)
        }

    def _analyze_pitch_stability(
        self,
        audio_data: np.ndarray,
        sample_rate: int
    ) -> float:
        """
        Analyze pitch stability (variance in fundamental frequency).
        Lower variance indicates more confident, stable speech.

        Args:
            audio_data: Audio waveform
            sample_rate: Sample rate

        Returns:
            Pitch stability score (0.0-1.0), higher = more stable
        """
        try:
            # Extract pitch (fundamental frequency)
            pitches, magnitudes = librosa.piptrack(
                y=audio_data, sr=sample_rate)

            # Get pitch values (non-zero)
            pitch_values = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                if pitch > 0:
                    pitch_values.append(pitch)

            if len(pitch_values) < 2:
                return 0.5  # Neutral score if insufficient data

            # Calculate coefficient of variation (CV)
            mean_pitch = np.mean(pitch_values)
            std_pitch = np.std(pitch_values)

            if mean_pitch == 0:
                return 0.5

            cv = std_pitch / mean_pitch

            # Convert CV to stability score (lower CV = higher stability)
            # Normalize: CV of 0.1 = score 1.0, CV of 0.5 = score 0.0
            stability = max(0.0, min(1.0, 1.0 - (cv - 0.1) / 0.4))

            return stability

        except Exception as e:
            logger.warning(f"Error analyzing pitch stability: {e}")
            return 0.5  # Neutral score on error

    def _count_filler_words(self, transcript: Optional[str]) -> int:
        """
        Count filler words in transcript.

        Args:
            transcript: Transcript text

        Returns:
            Count of filler words
        """
        if not transcript:
            return 0

        transcript_lower = transcript.lower()
        count = sum(
            1 for filler in self.filler_words if filler in transcript_lower)
        return count

    def _calculate_confidence_score(
        self,
        speech_rate: float,
        pause_metrics: Dict[str, Any],
        pitch_stability: float,
        filler_word_count: int,
        transcript_length: int
    ) -> float:
        """
        Calculate overall confidence score from metrics.

        Args:
            speech_rate: Words per minute
            pause_metrics: Dictionary with pause information
            pitch_stability: Pitch stability score (0.0-1.0)
            filler_word_count: Number of filler words
            transcript_length: Length of transcript in words

        Returns:
            Confidence score (0.0-1.0)
        """
        # Speech rate score (optimal around 150 WPM)
        rate_diff = abs(speech_rate - self.optimal_speech_rate)
        rate_score = max(0.0, 1.0 - (rate_diff / self.speech_rate_tolerance))
        rate_score = min(1.0, rate_score)

        # Pause score (fewer long pauses = more confident)
        pause_count = pause_metrics["count"]
        avg_pause_duration = pause_metrics["avg_duration"]
        # Normalize: 0 pauses = 1.0, 5+ pauses = 0.0
        pause_score = max(0.0, 1.0 - (pause_count / 5.0))
        # Penalize for very long pauses (>2 seconds)
        if avg_pause_duration > 2.0:
            pause_score *= 0.7

        # Filler word score (fewer fillers = more confident)
        filler_ratio = filler_word_count / max(transcript_length, 1)
        # Normalize: 0 fillers = 1.0, 0.1+ ratio = 0.0
        filler_score = max(0.0, 1.0 - (filler_ratio * 10))

        # Weighted combination
        # Speech rate: 30%, Pauses: 30%, Pitch stability: 25%, Filler words: 15%
        confidence_score = (
            0.30 * rate_score +
            0.30 * pause_score +
            0.25 * pitch_stability +
            0.15 * filler_score
        )

        return max(0.0, min(1.0, confidence_score))

    def _generate_reasoning(
        self,
        speech_rate: float,
        pause_metrics: Dict[str, Any],
        pitch_stability: float,
        filler_word_count: int
    ) -> str:
        """Generate human-readable reasoning for confidence score."""
        factors = []

        if speech_rate >= 120 and speech_rate <= 180:
            factors.append("appropriate speech rate")
        elif speech_rate < 120:
            factors.append("slow speech rate")
        else:
            factors.append("fast speech rate")

        if pause_metrics["count"] <= 2:
            factors.append("minimal pauses")
        elif pause_metrics["count"] > 5:
            factors.append("frequent pauses")

        if pitch_stability > 0.7:
            factors.append("stable voice pitch")
        else:
            factors.append("variable voice pitch")

        if filler_word_count == 0:
            factors.append("no filler words")
        elif filler_word_count > 5:
            factors.append("multiple filler words")

        return f"Confidence assessment based on: {', '.join(factors)}."

    def _analyze_transcript_only(
        self,
        transcript: Optional[str]
    ) -> Dict[str, Any]:
        """
        Fallback analysis using only transcript (no audio).

        Args:
            transcript: Transcript text

        Returns:
            Dictionary with fallback confidence score
        """
        if not transcript:
            return {
                "score": 0.5,
                "reasoning": "No transcript available for analysis",
                "metrics": {}
            }

        # Simple analysis based on filler words only
        filler_count = self._count_filler_words(transcript)
        word_count = len(transcript.split())
        filler_ratio = filler_count / max(word_count, 1)

        # Score based on filler word ratio
        score = max(0.0, min(1.0, 1.0 - (filler_ratio * 10)))

        return {
            "score": score,
            "reasoning": f"Transcript-only analysis: {filler_count} filler words found",
            "metrics": {
                "filler_word_count": filler_count,
                "transcript_length": word_count
            }
        }
