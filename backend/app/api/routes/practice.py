from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
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
# GET AVAILABLE TOPICS
# ============================================================

@router.get(
    "/topics",
    response_model=list[str],
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
            func.trim(Question.topic) != "",
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

    # --------------------------------------------------------
    # LIMIT
    # --------------------------------------------------------

    limit = max(
        1,
        min(limit, 20),
    )

    # --------------------------------------------------------
    # BASE QUERY
    #
    # IMPORTANT:
    # We let PostgreSQL perform the random selection.
    #
    # OLD:
    # Fetch ALL questions
    # → Python shuffle
    # → take 10
    #
    # NEW:
    # Database
    # → random
    # → LIMIT 10
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # SKILL
    # --------------------------------------------------------

    if skill_id is not None:
        query = query.where(
            Question.skill_id == skill_id
        )

    # --------------------------------------------------------
    # TOPIC
    # --------------------------------------------------------

    if topic:
        query = query.where(
            func.lower(
                Question.topic
            )
            == topic.strip().lower()
        )

    # --------------------------------------------------------
    # DIFFICULTY
    # --------------------------------------------------------

    if difficulty:
        query = query.where(
            Question.difficulty
            == difficulty.upper()
        )

    # --------------------------------------------------------
    # RANDOM + LIMIT
    # --------------------------------------------------------

    query = (
        query
        .order_by(
            func.random()
        )
        .limit(limit)
    )

    questions = db.scalars(
        query
    ).all()

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
    # SINGLE QUERY
    #
    # Fetch:
    # - selected option
    # - whether selected option is correct
    # - correct option ID
    # - explanation
    #
    # This avoids multiple database round trips.
    # --------------------------------------------------------

    correct_option_subquery = (
        select(Option.id)
        .where(
            Option.question_id
            == data.question_id,
            Option.is_correct.is_(True),
        )
        .limit(1)
        .scalar_subquery()
    )

    result = db.execute(
        select(
            Option.id,
            Option.is_correct,
            correct_option_subquery.label(
                "correct_option_id"
            ),
            Question.explanation,
        )
        .join(
            Question,
            Question.id
            == Option.question_id,
        )
        .where(
            Option.id
            == data.option_id,
            Option.question_id
            == data.question_id,
            Question.is_active.is_(True),
        )
    ).first()

    # --------------------------------------------------------
    # VALIDATE
    # --------------------------------------------------------

    if not result:
        raise HTTPException(
            status_code=400,
            detail="Invalid option for this question",
        )

    (
        selected_option_id,
        is_correct,
        correct_option_id,
        explanation,
    ) = result

    # --------------------------------------------------------
    # NO CORRECT OPTION CONFIGURED
    # --------------------------------------------------------

    if correct_option_id is None:
        raise HTTPException(
            status_code=500,
            detail="Question has no correct option configured",
        )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "correct": bool(is_correct),
        "correct_option_id": correct_option_id,
        "explanation": explanation,
    }