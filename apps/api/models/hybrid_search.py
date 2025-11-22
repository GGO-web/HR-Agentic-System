from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class CandidateDocument(BaseModel):
    """Schema for candidate document with content and metadata."""
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ScoreReasoning(BaseModel):
    """Explanation for each evaluation score."""
    technical_skills: str
    experience: str
    overall_match: str


class ResumeScores(BaseModel):
    """Three evaluation scores for resume matching."""
    technical_skills: float  # 0.0 - 1.0: Match of technical skills and technologies
    experience: float  # 0.0 - 1.0: Match of work experience and years
    overall_match: float  # 0.0 - 1.0: Overall semantic similarity match
    reasoning: Optional[ScoreReasoning] = None  # Explanations for each score


class SearchResult(BaseModel):
    """Schema for search result (chunk-level) - used internally by hybrid_matcher."""
    content: str
    score: float  # Overall score (average of three scores)
    scores: ResumeScores  # Three detailed evaluation scores
    search_type: str  # "hybrid", "vector", or "keyword"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class HybridScores(BaseModel):
    """Hybrid search scores: vector, BM25, and final hybrid score."""
    vector_score: float  # 0.0 - 1.0: Vector (semantic) similarity score
    bm25_score: float  # 0.0 - 1.0: BM25 (keyword) similarity score
    hybrid_score: float  # 0.0 - 1.0: Final hybrid score calculated with alpha coefficient


class CandidateMatchResult(BaseModel):
    """Schema for candidate match result with hybrid search scores."""
    candidate_id: str
    scores: HybridScores  # Vector, BM25, and hybrid scores
