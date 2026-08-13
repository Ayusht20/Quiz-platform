from datetime import datetime

from pydantic import BaseModel


class AttemptStartResponse(BaseModel):
    attempt_id: int
    assessment_id: int
    started_at: datetime
    expires_at: datetime


class AnswerSubmit(BaseModel):
    question_id: int
    selected_option_id: int | None = None


class AttemptSubmitRequest(BaseModel):
    answers: list[AnswerSubmit]


class AttemptResultResponse(BaseModel):
    attempt_id: int
    assessment_id: int
    score: int
    percentage: float
    correct_answers: int
    incorrect_answers: int
    unanswered: int
    time_taken_seconds: int | None
    status: str
    xp_earned: int
    current_xp: int
    current_level: int