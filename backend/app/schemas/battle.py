from pydantic import BaseModel, Field


# ============================================================
# GENERATE BATTLE REQUEST
#
# Student chooses:
#   1. Skill
#   2. Difficulty
#
# Topic is NOT selected for battles.
# The system automatically picks random questions
# from all available topics for that skill + difficulty.
# ============================================================

class BattleGenerateRequest(BaseModel):

    skill_id: int

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

    difficulty: str

    question_count: int

    duration_minutes: int