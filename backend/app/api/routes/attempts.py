from datetime import datetime, timedelta, timezone
import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

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

from app.services.quest_service import (
    update_battle_quests,
    update_question_quests,
    update_quest_progress,
)


router = APIRouter(
    prefix="/attempts",
    tags=["Attempts"],
)


# ============================================================
# AUTOMATIC BATTLE QUESTION SELECTION
# ============================================================

def generate_battle_questions(
    db: Session,
    assessment: Assessment,
):
    """
    Automatically select questions for a battle.

    Selection priority:

    1. Skill
    2. Topic (if configured)
    3. Difficulty
    4. Random selection
    5. Question count

    The selected questions are stored in
    assessment_questions so the battle remains
    stable after it starts.
    """

    # --------------------------------------------------------
    # Validate question count
    # --------------------------------------------------------

    question_count = assessment.question_count or 10

    if question_count < 1:
        question_count = 10

    # --------------------------------------------------------
    # Build question query
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

    if assessment.skill_id is not None:
        query = query.where(
            Question.skill_id == assessment.skill_id
        )

    # --------------------------------------------------------
    # FILTER BY TOPIC
    # --------------------------------------------------------

    if assessment.topic:
        query = query.where(
            Question.topic == assessment.topic
        )

    # --------------------------------------------------------
    # FILTER BY DIFFICULTY
    # --------------------------------------------------------

    difficulty = (
        assessment.difficulty or ""
    ).strip().upper()

    difficulty_map = {
        "BEGINNER": ["BEGINNER", "EASY"],
        "EASY": ["EASY", "BEGINNER"],
        "INTERMEDIATE": ["INTERMEDIATE"],
        "HARD": ["HARD"],
        "ADVANCED": ["HARD", "ADVANCED"],
        "EXPERT": ["EXPERT"],
    }

    allowed_difficulties = (
        difficulty_map.get(
            difficulty,
            [difficulty],
        )
    )

    if allowed_difficulties and allowed_difficulties != [""]:
        query = query.where(
            Question.difficulty.in_(
                allowed_difficulties
            )
        )

    # --------------------------------------------------------
    # FETCH QUESTIONS
    # --------------------------------------------------------

    questions = db.scalars(query).all()

    # --------------------------------------------------------
    # NOT ENOUGH QUESTIONS
    # --------------------------------------------------------

    if len(questions) < question_count:

        # If the exact difficulty does not have
        # enough questions, retry without difficulty.
        #
        # Skill + topic are still respected.

        fallback_query = (
            select(Question)
            .options(
                selectinload(Question.options)
            )
            .where(
                Question.is_active.is_(True)
            )
        )

        if assessment.skill_id is not None:
            fallback_query = fallback_query.where(
                Question.skill_id
                == assessment.skill_id
            )

        if assessment.topic:
            fallback_query = fallback_query.where(
                Question.topic
                == assessment.topic
            )

        fallback_questions = db.scalars(
            fallback_query
        ).all()

        if len(fallback_questions) >= question_count:
            questions = fallback_questions

    # --------------------------------------------------------
    # STILL NOT ENOUGH
    # --------------------------------------------------------

    if len(questions) < question_count:

        available = len(questions)

        raise HTTPException(
            status_code=400,
            detail=(
                f"Not enough questions available "
                f"for this battle. "
                f"Required: {question_count}, "
                f"Available: {available}."
            ),
        )

    # --------------------------------------------------------
    # RANDOMIZE
    # --------------------------------------------------------

    random.shuffle(questions)

    selected_questions = questions[
        :question_count
    ]

    # --------------------------------------------------------
    # REMOVE OLD QUESTION LINKS
    # --------------------------------------------------------

    old_links = db.scalars(
        select(AssessmentQuestion).where(
            AssessmentQuestion.assessment_id
            == assessment.id
        )
    ).all()

    for link in old_links:
        db.delete(link)

    db.flush()

    # --------------------------------------------------------
    # CREATE NEW QUESTION LINKS
    # --------------------------------------------------------

    for index, question in enumerate(
        selected_questions,
        start=1,
    ):

        assessment_question = AssessmentQuestion(
            assessment_id=assessment.id,
            question_id=question.id,
            question_order=index,
        )

        db.add(
            assessment_question
        )

    db.flush()

    return selected_questions


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

    # --------------------------------------------------------
    # GET ASSESSMENT
    # --------------------------------------------------------

    assessment = db.get(
        Assessment,
        assessment_id,
    )

    if not assessment:
        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    # --------------------------------------------------------
    # PUBLISHED CHECK
    # --------------------------------------------------------

    if not assessment.is_published:
        raise HTTPException(
            status_code=400,
            detail="Assessment is not published",
        )

    # --------------------------------------------------------
    # EXISTING UNFINISHED ATTEMPT
    # --------------------------------------------------------

    existing_attempt = db.scalar(
        select(Attempt)
        .where(
            Attempt.user_id
            == current_user.id,

            Attempt.assessment_id
            == assessment_id,

            Attempt.status
            == "IN_PROGRESS",
        )
        .order_by(
            Attempt.id.desc()
        )
    )

    if existing_attempt:

        # ----------------------------------------------------
        # Check if existing attempt expired
        # ----------------------------------------------------

        now = datetime.now(
            timezone.utc
        )

        if now >= existing_attempt.expires_at:

            existing_attempt.status = (
                "TIME_EXPIRED"
            )

            existing_attempt.completed_at = now

            db.commit()

        else:

            return AttemptStartResponse(
                attempt_id=existing_attempt.id,

                assessment_id=assessment.id,

                started_at=(
                    existing_attempt.started_at
                ),

                expires_at=(
                    existing_attempt.expires_at
                ),
            )

    # --------------------------------------------------------
    # MAXIMUM ATTEMPTS
    # --------------------------------------------------------

    if assessment.max_attempts is not None:

        completed_attempts = db.scalars(
            select(Attempt)
            .where(
                Attempt.user_id
                == current_user.id,

                Attempt.assessment_id
                == assessment_id,

                Attempt.status.in_(
                    [
                        "COMPLETED",
                        "TIME_EXPIRED",
                    ]
                ),
            )
        ).all()

        if (
            len(completed_attempts)
            >= assessment.max_attempts
        ):

            raise HTTPException(
                status_code=400,
                detail="Maximum attempts reached",
            )

    # ========================================================
    # AUTOMATIC QUESTION GENERATION
    # ========================================================

    generate_battle_questions(
        db=db,
        assessment=assessment,
    )

    # ========================================================
    # CREATE ATTEMPT
    # ========================================================

    now = datetime.now(
        timezone.utc
    )

    expires_datetime = (
        now
        + timedelta(
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

@router.get(
    "/{attempt_id}"
)
def get_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):

    # --------------------------------------------------------
    # GET ATTEMPT
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

    # --------------------------------------------------------
    # OWNERSHIP
    # --------------------------------------------------------

    if (
        attempt.user_id
        != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail="You cannot access this attempt",
        )

    # --------------------------------------------------------
    # STATUS
    # --------------------------------------------------------

    if attempt.status != "IN_PROGRESS":

        raise HTTPException(
            status_code=400,
            detail="Attempt is no longer active",
        )

    # --------------------------------------------------------
    # TIME CHECK
    # --------------------------------------------------------

    now = datetime.now(
        timezone.utc
    )

    if now >= attempt.expires_at:

        attempt.status = (
            "TIME_EXPIRED"
        )

        attempt.completed_at = now

        db.commit()

        raise HTTPException(
            status_code=400,
            detail="Attempt time has expired",
        )

    # ========================================================
    # LOAD QUESTIONS
    # ========================================================

    questions = db.scalars(
        select(Question)
        .join(
            AssessmentQuestion,
            AssessmentQuestion.question_id
            == Question.id,
        )
        .options(
            selectinload(
                Question.options
            )
        )
        .where(
            AssessmentQuestion.assessment_id
            == attempt.assessment_id,

            Question.is_active.is_(True),
        )
        .order_by(
            AssessmentQuestion.question_order
        )
    ).all()

    # --------------------------------------------------------
    # SAFETY CHECK
    # --------------------------------------------------------

    if not questions:

        raise HTTPException(
            status_code=400,
            detail="No questions available for this battle",
        )

    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "attempt_id":
            attempt.id,

        "assessment_id":
            attempt.assessment_id,

        "expires_at":
            attempt.expires_at,

        "questions": [

            {
                "id":
                    question.id,

                "skill_id":
                    question.skill_id,

                "topic":
                    question.topic,

                "question_text":
                    question.question_text,

                "difficulty":
                    question.difficulty,

                "marks":
                    question.marks,

                "options": [

                    {
                        "id":
                            option.id,

                        "option_text":
                            option.option_text,

                    }

                    for option
                    in question.options
                ],
            }

            for question
            in questions
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
    # GET ATTEMPT
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

    # --------------------------------------------------------
    # OWNERSHIP
    # --------------------------------------------------------

    if (
        attempt.user_id
        != current_user.id
    ):

        raise HTTPException(
            status_code=403,
            detail="You cannot submit this attempt",
        )

    # --------------------------------------------------------
    # STATUS
    # --------------------------------------------------------

    if attempt.status != "IN_PROGRESS":

        raise HTTPException(
            status_code=400,
            detail="Attempt is already completed",
        )

    # ========================================================
    # TIME / STATUS
    # ========================================================

    now = datetime.now(
        timezone.utc
    )

    if now >= attempt.expires_at:

        attempt.status = (
            "TIME_EXPIRED"
        )

    else:

        attempt.status = (
            "COMPLETED"
        )

    time_taken = int(
        (
            now
            - attempt.started_at
        ).total_seconds()
    )

    attempt.time_taken_seconds = (
        time_taken
    )

    attempt.completed_at = now

    # ========================================================
    # GET BATTLE QUESTIONS
    # ========================================================

    questions = db.scalars(
        select(Question)
        .join(
            AssessmentQuestion,
            AssessmentQuestion.question_id
            == Question.id,
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

    # ========================================================
    # RESULT COUNTERS
    # ========================================================

    submitted_question_ids = set()

    correct = 0

    incorrect = 0

    unanswered = 0

    total_score = 0

    # ========================================================
    # SKILL STATISTICS
    # ========================================================

    skill_stats = {}

    # ========================================================
    # PROCESS ANSWERS
    # ========================================================

    for submitted_answer in data.answers:

        question = question_map.get(
            submitted_answer.question_id
        )

        if not question:
            continue

        # ----------------------------------------------------
        # Prevent duplicate answers
        # ----------------------------------------------------

        if question.id in submitted_question_ids:
            continue

        submitted_question_ids.add(
            question.id
        )

        # ----------------------------------------------------
        # Skill entry
        # ----------------------------------------------------

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
        # Validate selected option
        # ----------------------------------------------------

        if submitted_answer.selected_option_id:

            selected_option = db.scalar(
                select(Option)
                .where(
                    Option.id
                    == submitted_answer.selected_option_id,

                    Option.question_id
                    == question.id,
                )
            )

        # ====================================================
        # UNANSWERED
        # ====================================================

        if not selected_option:

            unanswered += 1

            answer = Answer(
                attempt_id=attempt.id,

                question_id=question.id,

                selected_option_id=None,

                is_correct=False,

                marks_awarded=0,
            )

        # ====================================================
        # CORRECT
        # ====================================================

        elif selected_option.is_correct:

            correct += 1

            total_score += (
                question.marks
            )

            skill_data["answered"] += 1

            skill_data["correct"] += 1

            skill_data["xp"] += (
                question.marks * 10
            )

            answer = Answer(
                attempt_id=attempt.id,

                question_id=question.id,

                selected_option_id=(
                    selected_option.id
                ),

                is_correct=True,

                marks_awarded=question.marks,
            )

        # ====================================================
        # INCORRECT
        # ====================================================

        else:

            incorrect += 1

            skill_data["answered"] += 1

            answer = Answer(
                attempt_id=attempt.id,

                question_id=question.id,

                selected_option_id=(
                    selected_option.id
                ),

                is_correct=False,

                marks_awarded=0,
            )

        db.add(answer)

    # ========================================================
    # QUESTIONS NOT SUBMITTED
    # ========================================================

    unanswered += (
        len(question_map)
        - len(submitted_question_ids)
    )

    # ========================================================
    # TOTAL MARKS
    # ========================================================

    total_marks = sum(
        question.marks
        for question in questions
    )

    # ========================================================
    # PERCENTAGE
    # ========================================================

    percentage = (
        (
            total_score
            / total_marks
        )
        * 100

        if total_marks > 0

        else 0
    )

    percentage = round(
        percentage,
        2,
    )

    # ========================================================
    # UPDATE ATTEMPT
    # ========================================================

    attempt.score = total_score

    attempt.percentage = percentage

    attempt.correct_answers = correct

    attempt.incorrect_answers = incorrect

    attempt.unanswered = unanswered

    # ========================================================
    # GET ASSESSMENT
    # ========================================================

    assessment = db.get(
        Assessment,
        attempt.assessment_id,
    )

    if not assessment:

        raise HTTPException(
            status_code=404,
            detail="Assessment not found",
        )

    # ========================================================
    # BATTLE RESULT
    # ========================================================

    passed = (
        percentage
        >= assessment.passing_percentage
    )

    perfect = (
        percentage >= 100
    )

    # ========================================================
    # GLOBAL XP
    # ========================================================

    xp_earned = calculate_xp(
        attempt.percentage,
        assessment.difficulty,
    )

    award_xp(
        db=db,
        user=current_user,
        amount=xp_earned,
        reason=(
            f"Completed "
            f"{assessment.title}"
        ),
    )

    # ========================================================
    # SKILL PROGRESS
    # ========================================================

    for skill_id, stats in skill_stats.items():

        progress = db.scalar(
            select(SkillProgress)
            .where(
                SkillProgress.user_id
                == current_user.id,

                SkillProgress.skill_id
                == skill_id,
            )
        )

        # ----------------------------------------------------
        # Create progress
        # ----------------------------------------------------

        if not progress:

            progress = SkillProgress(
                user_id=current_user.id,

                skill_id=skill_id,

                xp=0,

                questions_answered=0,

                questions_correct=0,

                battles_completed=0,

                completed=False,

                mastered=False,
            )

            db.add(progress)

            db.flush()

        # ----------------------------------------------------
        # Previous state
        # ----------------------------------------------------

        was_completed = (
            progress.completed
        )

        was_mastered = (
            progress.mastered
        )

        # ----------------------------------------------------
        # Update statistics
        # ----------------------------------------------------

        progress.xp += stats["xp"]

        progress.questions_answered += (
            stats["answered"]
        )

        progress.questions_correct += (
            stats["correct"]
        )

        progress.battles_completed += 1

        # ====================================================
        # SKILL COMPLETION
        # ====================================================

        skill_completed_now = (
            stats["answered"] > 0
        )

        if (
            skill_completed_now
            and not progress.completed
        ):

            progress.completed = True

        # ====================================================
        # SKILL MASTERY
        # ====================================================

        skill_mastered_now = (
            stats["answered"] > 0
            and stats["correct"]
            == stats["answered"]
        )

        if (
            skill_mastered_now
            and not progress.mastered
        ):

            progress.mastered = True

        # ====================================================
        # COMPLETED SKILLS QUEST
        # ====================================================

        if (
            not was_completed
            and progress.completed
        ):

            update_quest_progress(
                db=db,

                user=current_user,

                target_type="COMPLETED_SKILLS",

                amount=1,
            )

        # ====================================================
        # MASTERED SKILLS QUEST
        # ====================================================

        if (
            not was_mastered
            and progress.mastered
        ):

            update_quest_progress(
                db=db,

                user=current_user,

                target_type="MASTERED_SKILLS",

                amount=1,
            )

    # ========================================================
    # QUEST PROGRESS
    # ========================================================

    completed_quests = []

    # --------------------------------------------------------
    # Battle / passed / perfect
    # --------------------------------------------------------

    completed_quests.extend(
        update_battle_quests(
            db=db,

            user=current_user,

            passed=passed,

            perfect=perfect,
        )
    )

    # --------------------------------------------------------
    # Questions / correct answers
    # --------------------------------------------------------

    completed_quests.extend(
        update_question_quests(
            db=db,

            user=current_user,

            questions_answered=len(
                submitted_question_ids
            ),

            correct_answers=correct,
        )
    )

    # ========================================================
    # BADGES
    # ========================================================

    check_badges(
        db=db,

        user_id=current_user.id,
    )

    # ========================================================
    # SAVE EVERYTHING
    # ========================================================

    db.commit()

    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return AttemptResultResponse(
        attempt_id=attempt.id,

        assessment_id=attempt.assessment_id,

        score=attempt.score,

        percentage=attempt.percentage,

        correct_answers=attempt.correct_answers,

        incorrect_answers=attempt.incorrect_answers,

        unanswered=attempt.unanswered,

        time_taken_seconds=(
            attempt.time_taken_seconds
        ),

        status=attempt.status,

        xp_earned=xp_earned,

        current_xp=current_user.xp,

        current_level=current_user.level,
    )