# Testing Guide for Hybrid Search Module

## Running Tests

### Prerequisites

Install test dependencies:
```bash
cd apps/api
pip install pytest pytest-asyncio pytest-mock
```

### Run All Tests

```bash
pytest tests/ -v
```

### Run Specific Test File

```bash
pytest tests/test_hybrid_search.py -v
pytest tests/test_api_routes.py -v
```

### Run with Coverage

```bash
pip install pytest-cov
pytest tests/ --cov=services --cov=models --cov-report=html
```

## Test Structure

### Unit Tests (`test_hybrid_search.py`)

- **TestTextSanitizer**: Tests for PII masking and text cleaning
- **TestDocumentLoader**: Tests for document loading and parsing
- **TestHybridMatcher**: Tests for hybrid search matcher initialization
- **TestHybridSearchService**: Tests for service orchestration

### Integration Tests (`test_api_routes.py`)

- **test_health_check**: Tests API health endpoint
- **test_find_matches_without_index**: Tests search without indexed documents
- **test_find_matches_invalid_search_type**: Tests validation
- **test_process_resume_invalid_file**: Tests file validation

## Manual Testing

### 1. Test Document Processing

```python
from services.hybrid_search_service import process_resume

# Process a resume
documents = await process_resume("./test_resume.pdf")
print(f"Processed {len(documents)} documents")
```

### 2. Test Text Sanitization

```python
from services.text_sanitizer import TextSanitizer

text = "Contact john@example.com or call +380 50 123 4567"
cleaned = TextSanitizer.clean_text(text)
print(cleaned)
# Should show: Contact <EMAIL_REDACTED> or call <PHONE_REDACTED>
```

### 3. Test Hybrid Search

```python
from services.hybrid_search_service import find_matches

# First, process some resumes
await process_resume("./resume1.pdf")
await process_resume("./resume2.docx")

# Then search
results = await find_matches(
    job_description="Python developer with FastAPI experience",
    k=5,
    search_type="hybrid"
)

for result in results:
    print(f"Score: {result.score}, Type: {result.search_type}")
    print(f"Content: {result.content[:100]}...")
```

### 4. Test API Endpoints

#### Health Check
```bash
curl http://localhost:8000/api/v1/hybrid-search/health
```

#### Process Resume
```bash
curl -X POST http://localhost:8000/api/v1/hybrid-search/process-resume \
  -F "file=@resume.pdf" \
  -F "candidate_id=123"
```

#### Find Matches
```bash
curl -X POST http://localhost:8000/api/v1/hybrid-search/find-matches \
  -H "Content-Type: application/json" \
  -d '{
    "job_description": "Python developer with FastAPI experience",
    "k": 5,
    "search_type": "hybrid"
  }'
```

## Test Data

Create test PDF/DOCX files with sample resume content:

**Sample Resume Content:**
```
John Doe
Python Developer
Email: john.doe@example.com
Phone: +380 50 123 4567

Experience:
- 5 years of Python development
- FastAPI and Django expertise
- RESTful API design
- Database optimization
```

## Troubleshooting

### Import Errors
Make sure you're running tests from the `apps/api` directory:
```bash
cd apps/api
pytest tests/
```

### ChromaDB Persistence
Tests use a separate test directory (`./test_chroma_db`). Clean up after tests:
```bash
rm -rf test_chroma_db
```

### Missing Dependencies
Install all requirements:
```bash
pip install -r requirements.txt
pip install pytest pytest-asyncio pytest-mock pytest-cov
```

