from pydantic import BaseModel, ConfigDict, Field


class OptionCreate(BaseModel):
    option_text: str = Field(min_length=1, max_length=500)
    is_correct: bool = False


class OptionResponse(BaseModel):
    id: int
    option_text: str
    is_correct: bool

    model_config = ConfigDict(from_attributes=True)


class QuestionCreate(BaseModel):
    skill_id: int
    question_text: str = Field(min_length=5)
    difficulty: str = "EASY"
    marks: int = Field(default=1, ge=1)
    explanation: str | None = None
    options: list[OptionCreate] = Field(
        min_length=2,
        max_length=6,
    )


class QuestionResponse(BaseModel):
    id: int
    skill_id: int
    question_text: str
    difficulty: str
    marks: int
    explanation: str | None
    is_active: bool
    options: list[OptionResponse]

    model_config = ConfigDict(from_attributes=True)