from pydantic import BaseModel, Field


# ============================================================
# GENERATE BATTLE REQUEST
# ============================================================

class BattleGenerateRequest(BaseModel):

    skill_id: int

    topic: str | None = None

    difficulty: str = "BEGINNER"

    question_count: int = Field(
        default=10,
        ge=5,
        le=20,
    )

    duration_minutes: int = Field(
        default=10,
        ge=1,
        le=60,
    )


# ============================================================
# GENERATE BATTLE RESPONSE
# ============================================================

class BattleGenerateResponse(BaseModel):

    assessment_id: int

    title: str

    skill_id: int

    skill_name: str

    topic: str | None

    difficulty: str

    question_count: int

    duration_minutes: int