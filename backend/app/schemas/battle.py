from pydantic import BaseModel, Field


class BattleGenerateRequest(BaseModel):

    skill_id: int = Field(
        gt=0,
    )

    topic: str = Field(
        min_length=2,
        max_length=150,
    )

    difficulty: str = Field(
        min_length=3,
        max_length=20,
    )

    question_count: int = Field(
        default=10,
        ge=5,
        le=30,
    )