from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# CREATE
# ============================================================

class AssessmentCreate(BaseModel):

    title: str = Field(
        min_length=2,
        max_length=200,
    )

    description: str | None = None

    assessment_type: str = Field(
        default="ASSESSMENT",
        max_length=30,
    )

    skill_id: int | None = None

    topic: str | None = Field(
        default=None,
        max_length=150,
    )

    difficulty: str = Field(
        default="BEGINNER",
        max_length=20,
    )

    question_count: int = Field(
        default=10,
        gt=0,
        le=100,
    )

    duration_minutes: int = Field(
        gt=0,
        le=300,
    )

    passing_percentage: int = Field(
        default=60,
        ge=0,
        le=100,
    )

    max_attempts: int | None = Field(
        default=None,
        gt=0,
    )


# ============================================================
# RESPONSE
# ============================================================

class AssessmentResponse(BaseModel):

    id: int

    title: str

    description: str | None

    assessment_type: str

    skill_id: int | None

    topic: str | None

    difficulty: str

    question_count: int

    duration_minutes: int

    passing_percentage: int

    max_attempts: int | None

    is_published: bool

    created_at: datetime

    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# QUESTION INSIDE ASSESSMENT
# ============================================================

class AssessmentQuestionResponse(BaseModel):

    id: int
    skill_id: int
    question_text: str
    difficulty: str
    marks: int

    options: list

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# ASSESSMENT DETAIL
# ============================================================

class AssessmentDetailResponse(BaseModel):

    id: int

    title: str

    description: str | None

    assessment_type: str

    skill_id: int | None

    topic: str | None

    difficulty: str

    question_count: int

    duration_minutes: int

    passing_percentage: int

    max_attempts: int | None

    is_published: bool

    created_at: datetime

    questions: list

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# ATTEMPT START
# ============================================================

class AttemptStartResponse(BaseModel):

    attempt_id: int

    assessment_id: int

    started_at: datetime

    expires_at: datetime