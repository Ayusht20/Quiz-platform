import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
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
# GET PRACTICE QUESTIONS
# ============================================================

@router.get(
    "/questions",
    response_model=list[PracticeQuestionResponse],
)
def get_practice_questions(
    skill_id: int | None = None,
    difficulty: str | None = None,
    limit: int = 10,
    db: Session = Depends(get_db),
    _: User = Depends(require_student),
):
    # --------------------------------------------------------
    # LIMIT
    # --------------------------------------------------------

    limit = max(1, min(limit, 20))

    # --------------------------------------------------------
    # QUERY
    # --------------------------------------------------------

    query = (
        select(Question)
        .options(
            selectinload(Question.options)
        )
        .where(
            Question.is_active.is_(True)
        )
    )

    # --------------------------------------------------------
    # FILTER BY SKILL
    # --------------------------------------------------------

    if skill_id is not None:
        query = query.where(
            Question.skill_id == skill_id
        )

    # --------------------------------------------------------
    # FILTER BY DIFFICULTY
    # --------------------------------------------------------

    if difficulty:
        query = query.where(
            Question.difficulty
            == difficulty.upper()
        )

    questions = db.scalars(query).all()

    # --------------------------------------------------------
    # RANDOMIZE
    # --------------------------------------------------------

    random.shuffle(questions)

    questions = questions[:limit]

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

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
    # --------------------------------------------------------
    # FIND QUESTION
    # --------------------------------------------------------

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
            detail="Question not found",
        )

    # --------------------------------------------------------
    # FIND SELECTED OPTION
    # --------------------------------------------------------

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
            detail="Invalid option for this question",
        )

    # --------------------------------------------------------
    # FIND CORRECT OPTION
    # --------------------------------------------------------

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
            detail="Question has no correct option configured",
        )

    # --------------------------------------------------------
    # CHECK ANSWER
    # --------------------------------------------------------

    return {
        "correct": (
            selected_option.id
            == correct_option.id
        ),
        "correct_option_id": correct_option.id,
        "explanation": question.explanation,
    }