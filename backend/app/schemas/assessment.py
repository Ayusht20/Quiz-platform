from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AssessmentCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str | None = None
    assessment_type: str = "PRACTICE"
    difficulty: str = "BEGINNER"
    duration_minutes: int = Field(ge=1, le=300)
    passing_percentage: int = Field(default=60, ge=0, le=100)
    max_attempts: int | None = Field(default=None, ge=1)


class AssessmentResponse(BaseModel):
    id: int
    title: str
    description: str | None
    assessment_type: str
    difficulty: str
    duration_minutes: int
    passing_percentage: int
    max_attempts: int | None
    is_published: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)