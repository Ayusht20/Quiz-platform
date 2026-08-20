import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import require_student
from app.db.session import get_db

from app.models.option import Option
from app.models.question import Question
from app.models.user import User

from app.schemas.practice import (
    PracticeCheckRequest,
    PracticeCheckResponse,
    PracticeQuestionResponse,
)


router = APIRouter(
    prefix="/practice",
    tags=["Practice"],
)


# ============================================================
# GET PRACTICE TOPICS
# ============================================================

@router.get(
    "/topics",
)
def get_practice_topics(
    skill_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_student),
):
    topics = db.scalars(
        select(
            Question.topic
        )
        .where(
            Question.skill_id == skill_id,
            Question.is_active.is_(True),
            Question.topic.is_not(None),
            func.trim(
                Question.topic
            ) != "",
        )
        .distinct()
        .order_by(
            Question.topic.asc()
        )
    ).all()

    return topics


# ============================================================
# GET PRACTICE QUESTIONS
# ============================================================

@router.get(
    "/questions",
    response_model=list[PracticeQuestionResponse],
)
def get_practice_questions(
    skill_id: int | None = None,
    topic: str | None = None,
    difficulty: str | None = None,
    limit: int = 10,
    db: Session = Depends(get_db),
    _: User = Depends(require_student),
):

    limit = max(
        1,
        min(limit, 20),
    )

    query = (
        select(Question)
        .options(
            selectinload(
                Question.options
            )
        )
        .where(
            Question.is_active.is_(True)
        )
    )

    if skill_id is not None:
        query = query.where(
            Question.skill_id == skill_id
        )

    if topic:
        query = query.where(
            func.lower(
                Question.topic
            )
            == topic.strip().lower()
        )

    if difficulty:
        query = query.where(
            Question.difficulty
            == difficulty.upper()
        )

    questions = db.scalars(
        query
        .order_by(
            func.random()
        )
        .limit(limit)
    ).all()

    return [
        {
            "id": question.id,
            "skill_id": question.skill_id,
            "topic": question.topic,
            "question_text": question.question_text,
            "difficulty": question.difficulty,
            "options": [
                {
                    "id": option.id,
                    "option_text": option.option_text,
                }
                for option in question.options
            ],
        }
        for question in questions
    ]


# ============================================================
# CHECK PRACTICE ANSWER
# ============================================================

@router.post(
    "/check",
    response_model=PracticeCheckResponse,
)
def check_practice_answer(
    data: PracticeCheckRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_student),
):

    question = db.scalar(
        select(Question)
        .where(
            Question.id == data.question_id,
            Question.is_active.is_(True),
        )
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found.",
        )

    selected_option = db.scalar(
        select(Option)
        .where(
            Option.id == data.option_id,
            Option.question_id
            == data.question_id,
        )
    )

    if not selected_option:
        raise HTTPException(
            status_code=400,
            detail="Invalid option for this question.",
        )

    correct_option = db.scalar(
        select(Option)
        .where(
            Option.question_id
            == data.question_id,
            Option.is_correct.is_(True),
        )
    )

    if not correct_option:
        raise HTTPException(
            status_code=500,
            detail=(
                "Question has no correct "
                "option configured."
            ),
        )

    return {
        "correct": (
            selected_option.id
            == correct_option.id
        ),
        "correct_option_id": correct_option.id,
        "explanation": question.explanation,
    }