# Hybrid Search Module Documentation

## Overview

The Hybrid Search module provides a complete ETL pipeline for processing resumes and job descriptions using hybrid search (combining vector and keyword-based retrieval).

## Architecture

The module follows an ETL pipeline:
1. **Load Document** → Parse PDF/DOCX files
2. **Sanitize** → Remove PII (emails, phones, links)
3. **Chunking** → Split text into optimal chunks
4. **Vectorization** → Create embeddings using sentence-transformers
5. **Hybrid Indexing** → Index using ChromaDB (vector) + BM25 (keyword)

## Components

### 1. DocumentLoader (`services/document_loader.py`)
- Loads and parses PDF and DOCX files
- Preserves document structure
- Extracts metadata (filename, source_type, etc.)

### 2. TextSanitizer (`services/text_sanitizer.py`)
- Masks PII: emails, phone numbers, links
- Cleans text for optimal tokenization
- Removes problematic special characters

### 3. HybridMatcher (`services/hybrid_matcher.py`)
- Vector Retriever: ChromaDB with HuggingFace embeddings
- Keyword Retriever: BM25 for sparse search
- Ensemble Retriever: Combines both with weights (0.7 vector, 0.3 BM25)

### 4. HybridSearchService (`services/hybrid_search_service.py`)
- Main orchestration service
- Provides high-level functions: `process_resume()` and `find_matches()`

## Usage Examples

### Basic Usage

```python
from services.hybrid_search_service import process_resume, find_matches

# Process a resume file
documents = await process_resume(
    file_path="./resumes/candidate_resume.pdf",
    metadata={"candidate_id": "123", "source": "linkedin"}
)

# Find matches for a job description
results = await find_matches(
    job_description="We are looking for a Python developer with FastAPI experience...",
    k=5,
    search_type="hybrid"  # or "vector" or "keyword"
)

for result in results:
    print(f"Score: {result.score}")
    print(f"Content: {result.content[:100]}...")
    print(f"Metadata: {result.metadata}")
```

### Using the Service Class

```python
from services.hybrid_search_service import HybridSearchService

service = HybridSearchService(
    persist_directory="./chroma_db",
    embedding_model="sentence-transformers/all-mpnet-base-v2"
)

# Process multiple resumes
resume1 = await service.process_resume("./resume1.pdf")
resume2 = await service.process_resume("./resume2.docx", metadata={"candidate_id": "456"})

# Find matches
results = await service.find_matches(
    job_description="Senior Python Developer...",
    k=10,
    search_type="hybrid"
)
```

### API Usage

The module is integrated into FastAPI with the following endpoints:

#### POST `/api/v1/hybrid-search/process-resume`
Upload and process a resume file.

**Request:**
- `file`: PDF or DOCX file
- `candidate_id` (optional): Candidate identifier

**Response:**
```json
{
  "message": "Resume processed successfully",
  "document_count": 1,
  "filename": "resume.pdf"
}
```

#### POST `/api/v1/hybrid-search/find-matches`
Find matching resume chunks for a job description.

**Request:**
```json
{
  "job_description": "We are looking for...",
  "k": 5,
  "search_type": "hybrid"
}
```

**Response:**
```json
{
  "results": [
    {
      "content": "Python developer with 5 years...",
      "score": 0.95,
      "search_type": "hybrid",
      "metadata": {
        "filename": "resume.pdf",
        "candidate_id": "123"
      }
    }
  ],
  "query": "We are looking for...",
  "search_type": "hybrid",
  "k": 5
}
```

## Configuration

### Chunking Parameters
- `chunk_size`: 500 (optimal for MPNet embeddings)
- `chunk_overlap`: 50 (preserves context between chunks)
- `separators`: ["\n\n", "\n", " ", ""]

### Hybrid Search Weights
- Vector weight: 0.7 (dense semantic search)
- BM25 weight: 0.3 (keyword-based search)

### Embedding Model
- Default: `sentence-transformers/all-mpnet-base-v2`
- Optimized for semantic similarity
- Supports multiple languages including Ukrainian

## PII Masking

The sanitizer automatically masks:
- **Emails**: `user@example.com` → `<EMAIL_REDACTED>`
- **Phone numbers**: `+380 50 123 4567` → `<PHONE_REDACTED>`
- **Links**: `https://example.com` → `<LINK_REDACTED>`

## Search Types

1. **hybrid** (default): Combines vector and keyword search with weighted fusion
2. **vector**: Semantic similarity search only
3. **keyword**: BM25 keyword-based search only

## Persistence

ChromaDB automatically persists to disk in the specified directory (`./chroma_db` by default). The index can be reloaded on subsequent runs:

```python
service = HybridSearchService()
if service.load_existing_index():
    print("Loaded existing index")
else:
    print("Creating new index")
    await service.process_resume("./resume.pdf")
```

## Requirements

All dependencies are listed in `requirements.txt`:
- langchain, langchain-core, langchain-community, langchain-text-splitters
- chromadb
- sentence-transformers
- pdfplumber
- python-docx
- rank-bm25

## Error Handling

The module includes comprehensive error handling:
- File not found errors
- Unsupported file formats
- Missing index errors (when searching before indexing)
- Invalid search type errors

## Performance Considerations

- **Async operations**: All I/O operations are async for FastAPI compatibility
- **GPU support**: Set `device='cuda'` in HybridMatcher for GPU acceleration
- **Batch processing**: Process multiple resumes before searching for better performance
- **Index persistence**: Reuse existing indexes to avoid re-indexing

