from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session ,selectinload

from app.api.dependencies import get_current_user, require_admin
from app.db.session import get_db
from app.models.assessment import Assessment
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentResponse,
       AssessmentDetailResponse,
    AttemptStartResponse,
)
from app.schemas.question import QuestionResponse
from app.models.assessment_question import AssessmentQuestion
from app.models.question import Question 
from app.schemas.assessment_question import (
    AssessmentQuestionCreate,
)
from datetime import datetime, timezone, timedelta
from sqlalchemy import func
from app.models.attempt import Attempt

router = APIRouter(
    prefix="/assessments",
    tags=["Assessments"],
)


@router.get(
    "",
    response_model=list[AssessmentResponse],
)
def get_assessments(
    db: Session = Depends(get_db),
):
    return db.scalars(
        select(Assessment)
        .where(Assessment.is_published.is_(True))
        .order_by(Assessment.id.desc())
    ).all()

@router.get(
    "/{assessment_id}",
    response_model=AssessmentDetailResponse,
)
def get_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
):
    assessment = db.scalar(
        select(Assessment)
        .options(
            selectinload(
                Assessment.assessment_questions
            )
            .selectinload(
                AssessmentQuestion.question
            )
            .selectinload(
                Question.options
            )
        )
        .where(
            Assessment.id == assessment_id,
            Assessment.is_published.is_(True),
        )
    )

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    ordered_questions = sorted(
        assessment.assessment_questions,
        key=lambda item: item.question_order,
    )

    questions = []

    for assessment_question in ordered_questions:
        question = assessment_question.question

        if not question.is_active:
            continue

        questions.append(
            {
                "id": question.id,
                "skill_id": question.skill_id,
                "question_text": question.question_text,
                "difficulty": question.difficulty,
                "marks": question.marks,
                "options": [
                    {
                        "id": option.id,
                        "option_text": option.option_text,
                    }
                    for option in question.options
                ],
            }
        )

    return {
        "id": assessment.id,
        "title": assessment.title,
        "description": assessment.description,
        "assessment_type": assessment.assessment_type,
        "difficulty": assessment.difficulty,
        "duration_minutes": assessment.duration_minutes,
        "passing_percentage": assessment.passing_percentage,
        "max_attempts": assessment.max_attempts,
        "is_published": assessment.is_published,
        "created_at": assessment.created_at,
        "questions": questions,
    }

@router.get(
    "/admin/all",
    response_model=list[AssessmentResponse],
)
def get_all_assessments(
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    return db.scalars(
        select(Assessment)
        .order_by(Assessment.id.desc())
    ).all()


@router.post(
    "",
    response_model=AssessmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_assessment(
    data: AssessmentCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    assessment = Assessment(
        title=data.title,
        description=data.description,
        assessment_type=data.assessment_type,
        difficulty=data.difficulty,
        duration_minutes=data.duration_minutes,
        passing_percentage=data.passing_percentage,
        max_attempts=data.max_attempts,
    )

    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return assessment


@router.patch(
    "/{assessment_id}/publish",
    response_model=AssessmentResponse,
)
def publish_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    assessment = db.get(Assessment, assessment_id)

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    assessment.is_published = True

    db.commit()
    db.refresh(assessment)

    return assessment

@router.post("/{assessment_id}/questions")
def add_question_to_assessment(
    assessment_id: int,
    data: AssessmentQuestionCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    assessment = db.get(
        Assessment,
        assessment_id,
    )

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    question = db.get(
        Question,
        data.question_id,
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found",
        )

    existing = db.scalar(
        select(AssessmentQuestion).where(
            AssessmentQuestion.assessment_id
            == assessment_id,
            AssessmentQuestion.question_id
            == data.question_id,
        )
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Question already added",
        )

    assessment_question = AssessmentQuestion(
        assessment_id=assessment_id,
        question_id=data.question_id,
        question_order=data.question_order,
    )

    db.add(assessment_question)
    db.commit()
    db.refresh(assessment_question)

    return {
        "message": "Question added to assessment",
        "assessment_question_id":
            assessment_question.id,
    }

@router.get(
    "/{assessment_id}/questions",
    response_model=list[QuestionResponse],
)
def get_assessment_questions(
    assessment_id: int,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    assessment = db.get(
        Assessment,
        assessment_id,
    )

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    questions = db.scalars(
        select(Question)
        .join(
            AssessmentQuestion,
            AssessmentQuestion.question_id
            == Question.id,
        )
        .options(
            selectinload(Question.options)
        )
        .where(
            AssessmentQuestion.assessment_id
            == assessment_id,
            Question.is_active.is_(True),
        )
        .order_by(
            AssessmentQuestion.question_order
        )
    ).all()

    return questions