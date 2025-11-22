from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class CandidateDocument(BaseModel):
    """Schema for candidate document with content and metadata."""
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SearchResult(BaseModel):
    """Schema for search result with score and metadata."""
    content: str
    score: float
    search_type: str  # "hybrid", "vector", or "keyword"
    metadata: Dict[str, Any] = Field(default_factory=dict)
