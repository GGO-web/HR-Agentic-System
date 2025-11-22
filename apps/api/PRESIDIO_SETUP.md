# Presidio Setup Guide

This guide explains how to set up Presidio for PII (Personally Identifiable Information) detection and anonymization.

## Installation

1. Install the required packages:
```bash
pip install presidio-analyzer presidio-anonymizer spacy
```

2. Download the required spaCy language models:
```bash
# For English (required)
python -m spacy download en_core_web_lg

# For Ukrainian (optional, but recommended for Ukrainian resumes)
python -m spacy download uk_core_news_sm
```

## How It Works

Presidio is used exclusively for detecting and anonymizing PII in resumes. The system:

1. **Detects PII** using Presidio's AnalyzerEngine:
   - Email addresses
   - Phone numbers
   - URLs
   - Names (PERSON entities)
   - Locations
   - Credit cards
   - IBAN codes
   - IP addresses
   - Date/time information

2. **Anonymizes PII** using Presidio's AnonymizerEngine:
   - Replaces detected PII with redaction labels (e.g., `<EMAIL_REDACTED>`, `<PHONE_REDACTED>`)
   - Preserves the structure and readability of the text

## Language Support

Presidio supports multiple languages. The system currently uses:
- **English (en)**: Default language, works well for most resumes
- **Ukrainian (uk)**: For Ukrainian-language resumes
- **Russian (ru)**: For Russian-language resumes

## Configuration

The sanitizer is automatically initialized when `TextSanitizer` is instantiated. It requires Presidio to be installed and properly configured.

## Testing

To test if Presidio is working correctly:

```python
from services.text_sanitizer import TextSanitizer

sanitizer = TextSanitizer()
text = "My name is John Doe and my email is john@gmail.com. Call me at +380 50 123 4567"
cleaned = sanitizer.clean_text(text)
print(cleaned)
# Should output: "My name is <NAME_REDACTED> and my email is <EMAIL_REDACTED>. Call me at <PHONE_REDACTED>"
```

## Troubleshooting

### Issue: ImportError for presidio modules
**Solution**: Install the required packages:
```bash
pip install presidio-analyzer presidio-anonymizer spacy
python -m spacy download en_core_web_lg
```

### Issue: Presidio initialization fails
**Solution**: Check if spaCy models are installed:
```bash
python -m spacy download en_core_web_lg
python -m spacy download uk_core_news_sm  # For Ukrainian support
```

### Issue: Presidio not detecting certain phone number formats
**Solution**: Presidio uses ML models for detection. For better results with Ukrainian phone numbers, ensure you're using the Ukrainian language model (`language="uk"`).

