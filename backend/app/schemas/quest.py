from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


# ============================================================
# ALLOWED VALUES
# ============================================================

QUEST_TYPES = {
    "DAILY",
    "WEEKLY",
    "ACHIEVEMENT",
}


TARGET_TYPES = {
    "BATTLES",
    "PASSED_BATTLES",
    "PERFECT_BATTLES",
    "QUESTIONS",
    "CORRECT_ANSWERS",
    "XP",
    "COMPLETED_SKILLS",
    "MASTERED_SKILLS",
}


# ============================================================
# CREATE
# ============================================================

class QuestCreate(BaseModel):

    title: str = Field(
        min_length=2,
        max_length=150,
    )

    description: str | None = None

    quest_type: str = Field(
        min_length=2,
        max_length=30,
    )

    target_type: str = Field(
        min_length=2,
        max_length=50,
    )

    target_value: int = Field(
        gt=0,
    )

    reward_xp: int = Field(
        gt=0,
    )

    starts_at: datetime | None = None

    ends_at: datetime | None = None

    # --------------------------------------------------------
    # QUEST TYPE
    # --------------------------------------------------------

    @field_validator("quest_type")
    @classmethod
    def validate_quest_type(
        cls,
        value: str,
    ) -> str:

        value = value.strip().upper()

        if value not in QUEST_TYPES:
            raise ValueError(
                "Invalid quest type. "
                "Allowed values: DAILY, WEEKLY, ACHIEVEMENT."
            )

        return value

    # --------------------------------------------------------
    # TARGET TYPE
    # --------------------------------------------------------

    @field_validator("target_type")
    @classmethod
    def validate_target_type(
        cls,
        value: str,
    ) -> str:

        value = value.strip().upper()

        if value not in TARGET_TYPES:
            raise ValueError(
                "Invalid target type."
            )

        return value


# ============================================================
# UPDATE
# ============================================================

class QuestUpdate(BaseModel):

    title: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    description: str | None = None

    quest_type: str | None = None

    target_type: str | None = None

    target_value: int | None = Field(
        default=None,
        gt=0,
    )

    reward_xp: int | None = Field(
        default=None,
        gt=0,
    )

    is_active: bool | None = None

    starts_at: datetime | None = None

    ends_at: datetime | None = None

    # --------------------------------------------------------
    # QUEST TYPE
    # --------------------------------------------------------

    @field_validator("quest_type")
    @classmethod
    def validate_quest_type(
        cls,
        value: str | None,
    ) -> str | None:

        if value is None:
            return None

        value = value.strip().upper()

        if value not in QUEST_TYPES:
            raise ValueError(
                "Invalid quest type. "
                "Allowed values: DAILY, WEEKLY, ACHIEVEMENT."
            )

        return value

    # --------------------------------------------------------
    # TARGET TYPE
    # --------------------------------------------------------

    @field_validator("target_type")
    @classmethod
    def validate_target_type(
        cls,
        value: str | None,
    ) -> str | None:

        if value is None:
            return None

        value = value.strip().upper()

        if value not in TARGET_TYPES:
            raise ValueError(
                "Invalid target type."
            )

        return value


# ============================================================
# ADMIN RESPONSE
# ============================================================

class QuestAdminResponse(BaseModel):

    id: int

    title: str

    description: str | None

    quest_type: str

    target_type: str

    target_value: int

    reward_xp: int

    is_active: bool

    starts_at: datetime | None

    ends_at: datetime | None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# STUDENT RESPONSE
# ============================================================

class QuestResponse(BaseModel):

    id: int

    title: str

    description: str | None

    quest_type: str

    target_type: str

    target_value: int

    reward_xp: int

    progress: int

    completed: bool

    reward_claimed: bool

    starts_at: datetime | None

    ends_at: datetime | None

    model_config = ConfigDict(
        from_attributes=True
    )