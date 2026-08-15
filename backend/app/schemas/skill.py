from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SkillCreate(BaseModel):
    category_id: int
    name: str = Field(min_length=2, max_length=100)
    description: str | None = None


class SkillUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = None


class SkillResponse(BaseModel):
    id: int
    category_id: int
    name: str
    description: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SkillProgressResponse(BaseModel):
    skill_id: int
    skill_name: str
    category_id: int
    category_name: str

    xp: int
    questions_answered: int
    questions_correct: int
    battles_completed: int

    accuracy: float

    model_config = ConfigDict(
        from_attributes=True
    )