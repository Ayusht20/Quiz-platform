from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.dependencies import require_admin
from app.db.session import get_db
from app.models.option import Option
from app.models.question import Question
from app.models.skill import Skill
from app.schemas.question import (
    QuestionCreate,
    QuestionResponse,
)


router = APIRouter(
    prefix="/questions",
    tags=["Questions"],
)


@router.get(
    "",
    response_model=list[QuestionResponse],
)
def get_questions(
    skill_id: int | None = None,
    difficulty: str | None = None,
    db: Session = Depends(get_db),
):
    query = (
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.is_active.is_(True))
    )

    if skill_id:
        query = query.where(
            Question.skill_id == skill_id
        )

    if difficulty:
        query = query.where(
            Question.difficulty == difficulty
        )

    return db.scalars(query).all()


@router.get(
    "/{question_id}",
    response_model=QuestionResponse,
)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
):
    question = db.scalar(
        select(Question)
        .options(selectinload(Question.options))
        .where(Question.id == question_id)
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    return question


@router.post(
    "",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_question(
    data: QuestionCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    skill = db.get(Skill, data.skill_id)

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found",
        )

    correct_count = sum(
        option.is_correct
        for option in data.options
    )

    if correct_count != 1:
        raise HTTPException(
            status_code=400,
            detail="Exactly one option must be correct",
        )

    question = Question(
        skill_id=data.skill_id,
        question_text=data.question_text,
        difficulty=data.difficulty,
        marks=data.marks,
        explanation=data.explanation,
    )

    for option_data in data.options:
        question.options.append(
            Option(
                option_text=option_data.option_text,
                is_correct=option_data.is_correct,
            )
        )

    db.add(question)
    db.commit()
    db.refresh(question)

    return question