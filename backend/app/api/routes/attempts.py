from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_student
from app.db.session import get_db
from app.models.answer import Answer
from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion
from app.models.attempt import Attempt
from app.models.option import Option
from app.models.question import Question
from app.models.user import User
from app.schemas.attempt import (
    AttemptResultResponse,
    AttemptStartResponse,
    AttemptSubmitRequest,
)


router = APIRouter(
    prefix="/attempts",
    tags=["Attempts"],
)

@router.post(
    "/assessment/{assessment_id}/start",
    response_model=AttemptStartResponse,
)
def start_attempt(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    assessment = db.get(Assessment, assessment_id)

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    if not assessment.is_published:
        raise HTTPException(
            status_code=400,
            detail="Assessment is not published",
        )

    # Check for existing unfinished attempt
    existing_attempt = db.scalar(
        select(Attempt)
        .where(
            Attempt.user_id == current_user.id,
            Attempt.assessment_id == assessment_id,
            Attempt.status == "IN_PROGRESS",
        )
        .order_by(Attempt.id.desc())
    )

    if existing_attempt:
        return AttemptStartResponse(
            attempt_id=existing_attempt.id,
            assessment_id=assessment.id,
            started_at=existing_attempt.started_at,
            expires_at=existing_attempt.expires_at,
        )

    # Check maximum attempts
    completed_attempts = db.scalar(
        select(Attempt)
        .where(
            Attempt.user_id == current_user.id,
            Attempt.assessment_id == assessment_id,
            Attempt.status.in_(["COMPLETED", "TIME_EXPIRED"]),
        )
    )

    if (
        assessment.max_attempts is not None
        and completed_attempts is not None
    ):
        count = len(
            db.scalars(
                select(Attempt).where(
                    Attempt.user_id == current_user.id,
                    Attempt.assessment_id == assessment_id,
                    Attempt.status.in_(
                        ["COMPLETED", "TIME_EXPIRED"]
                    ),
                )
            ).all()
        )

        if count >= assessment.max_attempts:
            raise HTTPException(
                status_code=400,
                detail="Maximum attempts reached",
            )

    now = datetime.now(timezone.utc)

    expires_at = (
        now.timestamp()
        + assessment.duration_minutes * 60
    )

    expires_datetime = datetime.fromtimestamp(
        expires_at,
        tz=timezone.utc,
    )

    attempt = Attempt(
        user_id=current_user.id,
        assessment_id=assessment.id,
        started_at=now,
        expires_at=expires_datetime,
        status="IN_PROGRESS",
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return AttemptStartResponse(
        attempt_id=attempt.id,
        assessment_id=assessment.id,
        started_at=attempt.started_at,
        expires_at=attempt.expires_at,
    )


@router.get("/{attempt_id}")
def get_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    attempt = db.get(Attempt, attempt_id)

    if not attempt:
        raise HTTPException(
            status_code=404,
            detail="Attempt not found",
        )

    if attempt.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot access this attempt",
        )

    if attempt.status != "IN_PROGRESS":
        raise HTTPException(
            status_code=400,
            detail="Attempt is no longer active",
        )

    now = datetime.now(timezone.utc)

    if now >= attempt.expires_at:
        attempt.status = "TIME_EXPIRED"
        attempt.completed_at = now

        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Attempt time has expired",
        )

    questions = db.scalars(
        select(Question)
        .join(
            AssessmentQuestion,
            AssessmentQuestion.question_id == Question.id,
        )
        .where(
            AssessmentQuestion.assessment_id
            == attempt.assessment_id
        )
        .order_by(
            AssessmentQuestion.question_order
        )
    ).all()

    return {
        "attempt_id": attempt.id,
        "assessment_id": attempt.assessment_id,
        "expires_at": attempt.expires_at,
        "questions": [
            {
                "id": question.id,
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
            for question in questions
        ],
    }

@router.get("/{attempt_id}")
def get_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    attempt = db.get(Attempt, attempt_id)

    if not attempt:
        raise HTTPException(
            status_code=404,
            detail="Attempt not found",
        )

    if attempt.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot access this attempt",
        )

    if attempt.status != "IN_PROGRESS":
        raise HTTPException(
            status_code=400,
            detail="Attempt is no longer active",
        )

    now = datetime.now(timezone.utc)

    if now >= attempt.expires_at:
        attempt.status = "TIME_EXPIRED"
        attempt.completed_at = now

        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Attempt time has expired",
        )

    questions = db.scalars(
        select(Question)
        .join(
            AssessmentQuestion,
            AssessmentQuestion.question_id == Question.id,
        )
        .where(
            AssessmentQuestion.assessment_id
            == attempt.assessment_id
        )
        .order_by(
            AssessmentQuestion.question_order
        )
    ).all()

    return {
        "attempt_id": attempt.id,
        "assessment_id": attempt.assessment_id,
        "expires_at": attempt.expires_at,
        "questions": [
            {
                "id": question.id,
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
            for question in questions
        ],
    }