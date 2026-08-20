from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import require_student
from app.db.session import get_db

from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion
from app.models.question import Question
from app.models.skill import Skill
from app.models.user import User

from app.schemas.battle import BattleGenerateRequest


router = APIRouter(
    prefix="/battles",
    tags=["Battles"],
)


# ============================================================
# GENERATE AUTOMATIC BATTLE
# ============================================================

@router.post(
    "/generate",
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
    # NORMALIZE VALUES
    # --------------------------------------------------------

    difficulty = data.difficulty.strip().upper()
    topic = data.topic.strip()

    # --------------------------------------------------------
    # VALIDATE DIFFICULTY
    # --------------------------------------------------------

    allowed_difficulties = {
        "EASY",
        "INTERMEDIATE",
        "HARD",
    }

    if difficulty not in allowed_difficulties:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid difficulty. "
                "Use EASY, INTERMEDIATE or HARD."
            ),
        )

    # --------------------------------------------------------
    # QUESTION COUNT
    # --------------------------------------------------------

    question_count = max(
        5,
        min(data.question_count, 30),
    )

    # --------------------------------------------------------
    # FIND RANDOM QUESTIONS
    # --------------------------------------------------------

    questions = db.scalars(
        select(Question)
        .where(
            Question.skill_id == data.skill_id,
            Question.is_active.is_(True),
            Question.difficulty == difficulty,
            func.lower(
                Question.topic
            ) == topic.lower(),
        )
        .order_by(
            func.random()
        )
        .limit(question_count)
    ).all()

    # --------------------------------------------------------
    # ENOUGH QUESTIONS?
    # --------------------------------------------------------

    if len(questions) < question_count:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Only {len(questions)} questions "
                f"are available for "
                f"{skill.name} / {topic} / "
                f"{difficulty}. "
                f"You need at least "
                f"{question_count}."
            ),
        )

    # --------------------------------------------------------
    # BATTLE CONFIGURATION
    # --------------------------------------------------------

    duration_map = {
        5: 5,
        10: 10,
        15: 15,
        20: 20,
        25: 25,
        30: 30,
    }

    duration_minutes = duration_map.get(
        question_count,
        question_count,
    )

    passing_percentage = 60

    # --------------------------------------------------------
    # CREATE INTERNAL ASSESSMENT
    # --------------------------------------------------------

    assessment = Assessment(
        title=(
            f"{skill.name} • "
            f"{topic} • "
            f"{difficulty.title()} Battle"
        ),
        description=(
            f"Automatic {difficulty.lower()} "
            f"battle for {skill.name} "
            f"— {topic}."
        ),
        assessment_type="BATTLE",
        skill_id=skill.id,
        topic=topic,
        difficulty=difficulty,
        question_count=question_count,
        duration_minutes=duration_minutes,
        passing_percentage=passing_percentage,
        max_attempts=1,
        is_published=True,
    )

    db.add(assessment)
    db.flush()

    # --------------------------------------------------------
    # ATTACH QUESTIONS
    # --------------------------------------------------------

    for index, question in enumerate(
        questions,
        start=1,
    ):
        db.add(
            AssessmentQuestion(
                assessment_id=assessment.id,
                question_id=question.id,
                question_order=index,
            )
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
        "duration_minutes": duration_minutes,
        "passing_percentage": passing_percentage,
    }