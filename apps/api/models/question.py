from pydantic import BaseModel
from typing import List, Optional


class JobDescription(BaseModel):
    title: str
    description: str


class Question(BaseModel):
    question: str
    order: int


class QuestionResponse(BaseModel):
    questions: List[Question]
