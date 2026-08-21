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
        "BEGINNER",
        "EASY",
        "INTERMEDIATE",
        "HARD",
        "EXPERT",
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
    # FIND ELIGIBLE QUESTIONS
    # --------------------------------------------------------

    query = (
        select(Question)
        .where(
            Question.skill_id == data.skill_id,
            Question.is_active.is_(True),
            Question.difficulty == difficulty,
        )
    )

    # --------------------------------------------------------
    # OPTIONAL TOPIC
    # --------------------------------------------------------

    topic = None

    if data.topic:
        topic = data.topic.strip()

        query = query.where(
            Question.topic == topic
        )

    questions = db.scalars(query).all()

    # --------------------------------------------------------
    # CHECK QUESTION AVAILABILITY
    # --------------------------------------------------------

    if len(questions) < question_count:

        topic_message = (
            f" for topic '{topic}'"
            if topic
            else ""
        )

        raise HTTPException(
            status_code=400,
            detail=(
                f"Not enough questions available"
                f"{topic_message}. "
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
    # The student never manually creates this.
    # --------------------------------------------------------

    assessment = Assessment(
        title=(
            f"{skill.name} "
            f"{topic + ' ' if topic else ''}"
            f"Battle"
        ),
        description=(
            f"Automatically generated "
            f"{difficulty.lower()} battle."
        ),
        assessment_type="BATTLE",
        skill_id=skill.id,
        topic=topic,
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
    # ATTACH QUESTIONS
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
        "topic": topic,
        "difficulty": difficulty,
        "question_count": question_count,
        "duration_minutes": data.duration_minutes,
    }