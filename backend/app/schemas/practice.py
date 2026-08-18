from pydantic import BaseModel


class PracticeOptionResponse(BaseModel):
    id: int
    option_text: str


class PracticeQuestionResponse(BaseModel):
    id: int
    skill_id: int
    topic: str | None
    question_text: str
    difficulty: str
    options: list[PracticeOptionResponse]


class PracticeCheckRequest(BaseModel):
    question_id: int
    option_id: int


class PracticeCheckResponse(BaseModel):
    correct: bool
    correct_option_id: int
    explanation: str | None