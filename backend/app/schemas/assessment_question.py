from pydantic import BaseModel, Field


class AssessmentQuestionCreate(BaseModel):
    question_id: int
    question_order: int = Field(ge=1)