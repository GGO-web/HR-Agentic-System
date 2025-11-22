from pydantic import BaseModel, Field
from typing import List, Optional


class JobDescription(BaseModel):
    title: str
    description: str
    temperature: Optional[float] = Field(
        0.7, ge=0.0, le=1.0, description="Model temperature for generation (0.0-1.0). Higher = more creative/varied.")
    regenerate: Optional[bool] = Field(False, description="If True, uses higher temperature for more varied questions")


class Question(BaseModel):
    question_text: str = Field(..., description="The actual question text")
    category: str = Field(..., description="Question category: 'intro', 'strengths', 'weaknesses', 'motivation', 'vision', 'challenge', 'culture', 'resilience', 'achievement', 'closing', 'technical', 'custom'")
    difficulty: Optional[str] = Field(None, description="Question difficulty: 'easy', 'medium', or 'hard'")
    expected_keywords: List[str] = Field(
        default_factory=list, description="Expected keywords or concepts in candidate's answer")
    order: Optional[int] = Field(
        None, description="Order of the question in the interview")
    status: Optional[str] = Field("pending", description="Approval status: 'pending' or 'approved'")

    # Backward compatibility
    @property
    def question(self) -> str:
        return self.question_text


class QuestionResponse(BaseModel):
    questions: List[Question]
    context_analysis: Optional[dict] = Field(
        None, description="Extracted context: hard skills and soft skills")
