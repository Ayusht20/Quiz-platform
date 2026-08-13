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
from app.services.xp_service import calculate_xp, award_xp
from app.services.badge_service import check_badges
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

@router.post(
    "/{attempt_id}/submit",
    response_model=AttemptResultResponse,
)
def submit_attempt(
    attempt_id: int,
    data: AttemptSubmitRequest,
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
            detail="You cannot submit this attempt",
        )

    if attempt.status != "IN_PROGRESS":
        raise HTTPException(
            status_code=400,
            detail="Attempt is already completed",
        )

    now = datetime.now(timezone.utc)

    if now >= attempt.expires_at:
        attempt.status = "TIME_EXPIRED"
    else:
        attempt.status = "COMPLETED"

    time_taken = int(
        (now - attempt.started_at).total_seconds()
    )

    attempt.time_taken_seconds = time_taken
    attempt.completed_at = now

    # Get assessment questions
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
    ).all()

    question_map = {
        question.id: question
        for question in questions
    }

    submitted_question_ids = set()

    correct = 0
    incorrect = 0
    unanswered = 0
    total_score = 0

    for submitted_answer in data.answers:

        question = question_map.get(
            submitted_answer.question_id
        )

        if not question:
            continue

        if question.id in submitted_question_ids:
            continue

        submitted_question_ids.add(question.id)

        selected_option = None

        if submitted_answer.selected_option_id:
            selected_option = db.scalar(
                select(Option).where(
                    Option.id
                    == submitted_answer.selected_option_id,
                    Option.question_id
                    == question.id,
                )
            )

        if not selected_option:
            unanswered += 1

            answer = Answer(
                attempt_id=attempt.id,
                question_id=question.id,
                selected_option_id=None,
                is_correct=False,
                marks_awarded=0,
            )

        elif selected_option.is_correct:
            correct += 1
            total_score += question.marks

            answer = Answer(
                attempt_id=attempt.id,
                question_id=question.id,
                selected_option_id=selected_option.id,
                is_correct=True,
                marks_awarded=question.marks,
            )

        else:
            incorrect += 1

            answer = Answer(
                attempt_id=attempt.id,
                question_id=question.id,
                selected_option_id=selected_option.id,
                is_correct=False,
                marks_awarded=0,
            )

        db.add(answer)

    unanswered += len(
        question_map
    ) - len(submitted_question_ids)

    total_marks = sum(
        question.marks
        for question in questions
    )

    percentage = (
        (total_score / total_marks) * 100
        if total_marks > 0
        else 0
    )

    attempt.score = total_score
    attempt.percentage = round(
        percentage,
        2,
    )
    assessment = db.get(
    Assessment,
    attempt.assessment_id,
)

    xp_earned = calculate_xp(
        attempt.percentage,
        assessment.difficulty,
    )

    award_xp(
        db=db,
        user=current_user,
        amount=xp_earned,
        reason=f"Completed {assessment.title}",
    )
    check_badges(
    db=db,
    user_id=current_user.id,
    )
    attempt.correct_answers = correct
    attempt.incorrect_answers = incorrect
    attempt.unanswered = unanswered

    db.commit()

    return AttemptResultResponse(
        attempt_id=attempt.id,
        assessment_id=attempt.assessment_id,
        score=attempt.score,
        percentage=attempt.percentage,
        correct_answers=attempt.correct_answers,
        incorrect_answers=attempt.incorrect_answers,
        unanswered=attempt.unanswered,
        time_taken_seconds=attempt.time_taken_seconds,
        status=attempt.status,
    )