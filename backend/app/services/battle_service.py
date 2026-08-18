import random

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.question import Question


def get_random_questions(
    db: Session,
    skill_id: int,
    topic: str | None,
    difficulty: str | None,
    question_count: int,
):
    query = select(Question).where(
        Question.skill_id == skill_id,
        Question.is_active.is_(True),
    )

    if topic:
        query = query.where(
            Question.topic == topic
        )

    if difficulty:
        query = query.where(
            Question.difficulty == difficulty
        )

    questions = db.scalars(query).all()

    if len(questions) < question_count:
        raise ValueError(
            f"Only {len(questions)} matching "
            f"questions are available."
        )

    return random.sample(
        questions,
        question_count,
    )