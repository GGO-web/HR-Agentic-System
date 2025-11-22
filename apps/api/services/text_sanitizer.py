import re
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig


class TextSanitizer:
    """Class for cleaning and sanitizing text with PII masking using Presidio."""

    def __init__(self):
        """Initialize Presidio engines."""
        self.analyzer = AnalyzerEngine()
        self.anonymizer = AnonymizerEngine()

    def clean_text(self, text: str, language: str = "en") -> str:
        """
        Clean and sanitize text by masking PII using Presidio.

        Args:
            text: Raw text to clean
            language: Language code for Presidio analyzer (default: "en", supports "uk" for Ukrainian)

        Returns:
            Cleaned text with PII masked
        """
        if not text:
            return ""

        # Analyze text for PII entities using Presidio
        # Presidio supports: en, es, it, pt, fr, de, zh, ja, ar, he, hi, ko, pl, ru, uk, etc.
        analyzer_language = language if language in [
            "en", "uk", "ru"] else "en"

        results = self.analyzer.analyze(
            text=text,
            language=analyzer_language
        )

        # Configure anonymization operators to use redaction with custom labels
        operators = {
            "EMAIL_ADDRESS": OperatorConfig("replace", {"new_value": "<EMAIL_REDACTED>"}),
            "PHONE_NUMBER": OperatorConfig("replace", {"new_value": "<PHONE_REDACTED>"}),
            "URL": OperatorConfig("replace", {"new_value": "<LINK_REDACTED>"}),
            "PERSON": OperatorConfig("replace", {"new_value": "<NAME_REDACTED>"}),
            "LOCATION": OperatorConfig("replace", {"new_value": "<LOCATION_REDACTED>"}),
            "CREDIT_CARD": OperatorConfig("replace", {"new_value": "<CREDIT_CARD_REDACTED>"}),
            "IBAN_CODE": OperatorConfig("replace", {"new_value": "<IBAN_REDACTED>"}),
            "IP_ADDRESS": OperatorConfig("replace", {"new_value": "<IP_REDACTED>"}),
            "DATE_TIME": OperatorConfig("replace", {"new_value": "<DATE_REDACTED>"}),
        }

        # Anonymize text
        anonymized = self.anonymizer.anonymize(
            text=text,
            analyzer_results=results,
            operators=operators
        )

        text = anonymized.text

        # Clean up whitespace and special characters
        text = self._post_process_text(text)

        return text

    @staticmethod
    def _post_process_text(text: str) -> str:
        """Post-process text: clean whitespace and special characters."""
        # Remove excessive whitespace (multiple spaces, tabs, newlines)
        text = re.sub(r'\s+', ' ', text)

        # Remove special characters that break tokenization
        # Keep alphanumeric, basic punctuation, Ukrainian characters, and common symbols
        text = re.sub(
            r'[^\w\s\u0400-\u04FF.,!?;:()\-"\'/&%$#@*+=<>\[\]{}]', ' ', text)

        # Clean up multiple spaces again after character removal
        text = re.sub(r'\s+', ' ', text)

        # Strip leading/trailing whitespace
        text = text.strip()

        return text
