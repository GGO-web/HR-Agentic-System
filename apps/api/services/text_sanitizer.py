import re
from typing import Optional


class TextSanitizer:
    """Class for cleaning and sanitizing text with PII masking."""

    # Regex patterns for PII detection
    EMAIL_PATTERN = re.compile(
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    )

    # Ukrainian phone patterns: +380..., 0XX...
    PHONE_PATTERN = re.compile(
        r'(\+380\s?)?(\(?\d{2,3}\)?[\s-]?)?\d{3}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}'
    )

    # URL patterns
    LINK_PATTERN = re.compile(
        r'https?://[^\s<>"{}|\\^`\[\]]+'
    )

    @staticmethod
    def clean_text(text: str) -> str:
        """
        Clean and sanitize text by masking PII and removing problematic characters.

        Args:
            text: Raw text to clean

        Returns:
            Cleaned text with PII masked
        """
        if not text:
            return ""

        # Mask emails
        text = TextSanitizer.EMAIL_PATTERN.sub("<EMAIL_REDACTED>", text)

        # Mask phone numbers
        text = TextSanitizer.PHONE_PATTERN.sub("<PHONE_REDACTED>", text)

        # Mask links
        text = TextSanitizer.LINK_PATTERN.sub("<LINK_REDACTED>", text)

        # Remove excessive whitespace (multiple spaces, tabs, newlines)
        text = re.sub(r'\s+', ' ', text)

        # Remove special characters that break tokenization
        # Keep alphanumeric, basic punctuation, and Ukrainian characters
        text = re.sub(r'[^\w\s\u0400-\u04FF.,!?;:()\-"\']', ' ', text)

        # Clean up multiple spaces again after character removal
        text = re.sub(r'\s+', ' ', text)

        # Strip leading/trailing whitespace
        text = text.strip()

        return text
