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
from app.models.skill_progress import SkillProgress
from app.models.user import User

from app.schemas.attempt import (
    AttemptResultResponse,
    AttemptStartResponse,
    AttemptSubmitRequest,
)

from app.services.xp_service import (
    calculate_xp,
    award_xp,
)

from app.services.badge_service import check_badges


router = APIRouter(
    prefix="/attempts",
    tags=["Attempts"],
)


# ============================================================
# START ATTEMPT
# ============================================================

@router.post(
    "/assessment/{assessment_id}/start",
    response_model=AttemptStartResponse,
)
def start_attempt(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
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

    if not assessment.is_published:
        raise HTTPException(
            status_code=400,
            detail="Assessment is not published",
        )

    # --------------------------------------------------------
    # Check for existing unfinished attempt
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Check maximum attempts
    # --------------------------------------------------------

    if assessment.max_attempts is not None:
        completed_attempts = db.scalars(
            select(Attempt)
            .where(
                Attempt.user_id == current_user.id,
                Attempt.assessment_id == assessment_id,
                Attempt.status.in_(
                    ["COMPLETED", "TIME_EXPIRED"]
                ),
            )
        ).all()

        if len(completed_attempts) >= assessment.max_attempts:
            raise HTTPException(
                status_code=400,
                detail="Maximum attempts reached",
            )

    # --------------------------------------------------------
    # Create attempt
    # --------------------------------------------------------

    now = datetime.now(timezone.utc)

    expires_datetime = (
        now
        + __import__("datetime").timedelta(
            minutes=assessment.duration_minutes
        )
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


# ============================================================
# GET ATTEMPT
# ============================================================

@router.get("/{attempt_id}")
def get_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    attempt = db.get(
        Attempt,
        attempt_id,
    )

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


# ============================================================
# SUBMIT ATTEMPT
# ============================================================

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
    # --------------------------------------------------------
    # Get attempt
    # --------------------------------------------------------

    attempt = db.get(
        Attempt,
        attempt_id,
    )

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

    # --------------------------------------------------------
    # Time / status
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Get assessment questions
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Result counters
    # --------------------------------------------------------

    submitted_question_ids = set()

    correct = 0
    incorrect = 0
    unanswered = 0
    total_score = 0

    # --------------------------------------------------------
    # Skill statistics for this battle
    #
    # Example:
    #
    # {
    #     1: {
    #         "answered": 5,
    #         "correct": 4,
    #         "xp": 40
    #     },
    #     2: {
    #         "answered": 3,
    #         "correct": 2,
    #         "xp": 20
    #     }
    # }
    # --------------------------------------------------------

    skill_stats = {}

    for submitted_answer in data.answers:

        question = question_map.get(
            submitted_answer.question_id
        )

        if not question:
            continue

        # Prevent duplicate answers for the same question
        if question.id in submitted_question_ids:
            continue

        submitted_question_ids.add(
            question.id
        )

        # Create skill entry
        skill_data = skill_stats.setdefault(
            question.skill_id,
            {
                "answered": 0,
                "correct": 0,
                "xp": 0,
            },
        )

        selected_option = None

        # ----------------------------------------------------
        # Validate selected option belongs to question
        # ----------------------------------------------------

        if submitted_answer.selected_option_id:
            selected_option = db.scalar(
                select(Option).where(
                    Option.id
                    == submitted_answer.selected_option_id,
                    Option.question_id
                    == question.id,
                )
            )

        # ----------------------------------------------------
        # Unanswered
        # ----------------------------------------------------

        if not selected_option:

            unanswered += 1

            answer = Answer(
                attempt_id=attempt.id,
                question_id=question.id,
                selected_option_id=None,
                is_correct=False,
                marks_awarded=0,
            )

        # ----------------------------------------------------
        # Correct
        # ----------------------------------------------------

        elif selected_option.is_correct:

            correct += 1

            total_score += question.marks

            skill_data["answered"] += 1
            skill_data["correct"] += 1

            # Skill XP:
            # 10 XP per mark for a correct answer
            skill_data["xp"] += (
                question.marks * 10
            )

            answer = Answer(
                attempt_id=attempt.id,
                question_id=question.id,
                selected_option_id=selected_option.id,
                is_correct=True,
                marks_awarded=question.marks,
            )

        # ----------------------------------------------------
        # Incorrect
        # ----------------------------------------------------

        else:

            incorrect += 1

            skill_data["answered"] += 1

            answer = Answer(
                attempt_id=attempt.id,
                question_id=question.id,
                selected_option_id=selected_option.id,
                is_correct=False,
                marks_awarded=0,
            )

        db.add(answer)

    # --------------------------------------------------------
    # Questions that weren't submitted at all
    # --------------------------------------------------------

    unanswered += (
        len(question_map)
        - len(submitted_question_ids)
    )

    # --------------------------------------------------------
    # Total marks / percentage
    # --------------------------------------------------------

    total_marks = sum(
        question.marks
        for question in questions
    )

    percentage = (
        (total_score / total_marks) * 100
        if total_marks > 0
        else 0
    )

    # --------------------------------------------------------
    # Update attempt result
    # --------------------------------------------------------

    attempt.score = total_score

    attempt.percentage = round(
        percentage,
        2,
    )

    attempt.correct_answers = correct
    attempt.incorrect_answers = incorrect
    attempt.unanswered = unanswered

    # --------------------------------------------------------
    # Get assessment
    # --------------------------------------------------------

    assessment = db.get(
        Assessment,
        attempt.assessment_id,
    )

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    # --------------------------------------------------------
    # GLOBAL XP
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # SKILL PROGRESS
    # --------------------------------------------------------

    for skill_id, stats in skill_stats.items():

        progress = db.scalar(
            select(SkillProgress).where(
                SkillProgress.user_id
                == current_user.id,
                SkillProgress.skill_id
                == skill_id,
            )
        )

        # Create progress row if this is
        # the student's first battle
        # containing this skill.
        if not progress:

            progress = SkillProgress(
                user_id=current_user.id,
                skill_id=skill_id,
                xp=0,
                questions_answered=0,
                questions_correct=0,
                battles_completed=0,
            )

            db.add(progress)

        # Add skill progress
        progress.xp += stats["xp"]

        progress.questions_answered += (
            stats["answered"]
        )

        progress.questions_correct += (
            stats["correct"]
        )

        progress.battles_completed += 1

    # --------------------------------------------------------
    # CHECK BADGES
    # --------------------------------------------------------

    check_badges(
        db=db,
        user_id=current_user.id,
    )

    # --------------------------------------------------------
    # SAVE EVERYTHING
    # --------------------------------------------------------

    db.commit()

    # --------------------------------------------------------
    # FINAL RESPONSE
    # --------------------------------------------------------

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
        xp_earned=xp_earned,
        current_xp=current_user.xp,
        current_level=current_user.level
    )