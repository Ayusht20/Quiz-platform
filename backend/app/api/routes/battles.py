import random

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_student
from app.db.session import get_db

from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion
from app.models.question import Question
from app.models.skill import Skill
from app.models.user import User

from app.schemas.battle import (
    BattleGenerateRequest,
    BattleGenerateResponse,
)


router = APIRouter(
    prefix="/battles",
    tags=["Battles"],
)


# ============================================================
# GENERATE AUTOMATIC BATTLE
#
# Student chooses:
#
#     Skill
#       ↓
#   Difficulty
#       ↓
#   Random questions
#
# Topic is NEVER selected by the student.
# ============================================================

@router.post(
    "/generate",
    response_model=BattleGenerateResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_battle(
    data: BattleGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):

    # --------------------------------------------------------
    # VALIDATE SKILL
    # --------------------------------------------------------

    skill = db.get(
        Skill,
        data.skill_id,
    )

    if not skill or not skill.is_active:
        raise HTTPException(
            status_code=404,
            detail="Skill not found.",
        )

    # --------------------------------------------------------
    # VALIDATE DIFFICULTY
    # --------------------------------------------------------

    difficulty = data.difficulty.strip().upper()
    allowed_difficulties = {
        "EASY",
        "MEDIUM",
        "HARD",
    }

    if difficulty not in allowed_difficulties:
        raise HTTPException(
            status_code=400,
            detail="Invalid battle difficulty.",
        )

    # --------------------------------------------------------
    # QUESTION COUNT
    # --------------------------------------------------------

    question_count = min(
        max(data.question_count, 5),
        20,
    )

    # --------------------------------------------------------
    # FIND QUESTIONS
    #
    # IMPORTANT:
    #
    # We DO NOT filter by topic.
    #
    # Therefore all topics belonging to:
    #
    # Skill + Difficulty
    #
    # can participate in the battle.
    # --------------------------------------------------------

    questions = db.scalars(
        select(Question)
        .where(
            Question.skill_id == data.skill_id,
            Question.difficulty == difficulty,
            Question.is_active.is_(True),
        )
    ).all()

    # --------------------------------------------------------
    # CHECK QUESTION AVAILABILITY
    # --------------------------------------------------------

    if len(questions) < question_count:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Not enough questions available "
                f"for {skill.name} at "
                f"{difficulty} level. "
                f"Required: {question_count}, "
                f"Available: {len(questions)}."
            ),
        )

    # --------------------------------------------------------
    # RANDOM SELECTION
    # --------------------------------------------------------

    selected_questions = random.sample(
        questions,
        question_count,
    )

    # --------------------------------------------------------
    # CREATE INTERNAL ASSESSMENT
    #
    # Student never creates this manually.
    # --------------------------------------------------------

    assessment = Assessment(
        title=(
            f"{skill.name} "
            f"{difficulty.title()} Battle"
        ),
        description=(
            f"Automatically generated "
            f"{difficulty.lower()} battle "
            f"covering available topics."
        ),
        assessment_type="BATTLE",
        skill_id=skill.id,
        topic=None,
        difficulty=difficulty,
        question_count=question_count,
        duration_minutes=data.duration_minutes,
        passing_percentage=60,
        max_attempts=1,
        is_published=True,
    )

    db.add(assessment)
    db.flush()

    # --------------------------------------------------------
    # ATTACH RANDOM QUESTIONS
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

    db.commit()

    db.refresh(assessment)

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "assessment_id": assessment.id,
        "title": assessment.title,
        "skill_id": skill.id,
        "skill_name": skill.name,
        "topic": None,
        "difficulty": difficulty,
        "question_count": question_count,
        "duration_minutes": data.duration_minutes,
    }