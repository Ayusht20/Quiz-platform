from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db.session import get_db

from app.models.answer import Answer
from app.models.assessment import Assessment
from app.models.attempt import Attempt
from app.models.quest import Quest
from app.models.question import Question
from app.models.skill import Skill
from app.models.user import User


router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"],
)


# ============================================================
# USERS
# ============================================================

@router.get("/users")
def get_admin_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    users = db.scalars(
        select(User)
        .order_by(User.id.desc())
    ).all()

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "xp": user.xp,
            "level": user.level,
            "created_at": user.created_at,
        }
        for user in users
    ]


# ============================================================
# SKILLS
# ============================================================

@router.get("/skills")
def get_admin_skills(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    skills = db.scalars(
        select(Skill)
        .where(
            Skill.is_active.is_(True)
        )
        .order_by(Skill.name.asc())
    ).all()

    result = []

    for skill in skills:

        # ----------------------------------------------------
        # TOTAL QUESTIONS
        # ----------------------------------------------------

        total_questions = db.scalar(
            select(func.count(Question.id))
            .where(
                Question.skill_id == skill.id,
                Question.is_active.is_(True),
            )
        ) or 0

        # ----------------------------------------------------
        # EASY
        # ----------------------------------------------------

        easy_questions = db.scalar(
            select(func.count(Question.id))
            .where(
                Question.skill_id == skill.id,
                Question.is_active.is_(True),
                Question.difficulty == "EASY",
            )
        ) or 0

        # ----------------------------------------------------
        # MEDIUM / INTERMEDIATE
        # ----------------------------------------------------

        medium_questions = db.scalar(
            select(func.count(Question.id))
            .where(
                Question.skill_id == skill.id,
                Question.is_active.is_(True),
                Question.difficulty.in_(
                    [
                        "MEDIUM",
                        "INTERMEDIATE",
                    ]
                ),
            )
        ) or 0

        # ----------------------------------------------------
        # HARD
        # ----------------------------------------------------

        hard_questions = db.scalar(
            select(func.count(Question.id))
            .where(
                Question.skill_id == skill.id,
                Question.is_active.is_(True),
                Question.difficulty.in_(
                    [
                        "HARD",
                        "EXPERT",
                    ]
                ),
            )
        ) or 0

        # ----------------------------------------------------
        # TOPICS
        # ----------------------------------------------------

        topic_rows = db.scalars(
            select(
                Question.topic
            )
            .where(
                Question.skill_id == skill.id,
                Question.is_active.is_(True),
                Question.topic.is_not(None),
                func.trim(
                    Question.topic
                ) != "",
            )
            .distinct()
            .order_by(
                Question.topic.asc()
            )
        ).all()

        topics = [
            topic.strip()
            for topic in topic_rows
            if topic and topic.strip()
        ]

        result.append(
            {
                "id": skill.id,
                "name": skill.name,
                "description": skill.description,
                "category_id": skill.category_id,
                "total_questions": total_questions,
                "easy_questions": easy_questions,
                "medium_questions": medium_questions,
                "hard_questions": hard_questions,
                "topic_count": len(topics),
                "topics": topics,
            }
        )

    return result


# ============================================================
# ANALYTICS
# ============================================================

@router.get("/analytics")
def get_admin_analytics(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):

    # --------------------------------------------------------
    # USERS
    # --------------------------------------------------------

    total_students = db.scalar(
        select(func.count(User.id))
        .where(
            User.role == "STUDENT"
        )
    ) or 0

    active_students = db.scalar(
        select(func.count(User.id))
        .where(
            User.role == "STUDENT",
            User.status == "ACTIVE",
        )
    ) or 0

    # --------------------------------------------------------
    # QUESTIONS
    # --------------------------------------------------------

    total_questions = db.scalar(
        select(func.count(Question.id))
        .where(
            Question.is_active.is_(True)
        )
    ) or 0

    # --------------------------------------------------------
    # SKILLS
    # --------------------------------------------------------

    total_skills = db.scalar(
        select(func.count(Skill.id))
        .where(
            Skill.is_active.is_(True)
        )
    ) or 0

    # --------------------------------------------------------
    # QUESTS
    # --------------------------------------------------------

    active_quests = db.scalar(
        select(func.count(Quest.id))
        .where(
            Quest.is_active.is_(True)
        )
    ) or 0

    # --------------------------------------------------------
    # BATTLES
    # --------------------------------------------------------

    total_battles = db.scalar(
        select(func.count(Assessment.id))
        .where(
            Assessment.assessment_type == "BATTLE"
        )
    ) or 0

    completed_battles = db.scalar(
        select(func.count(Attempt.id))
        .join(
            Assessment,
            Assessment.id
            == Attempt.assessment_id,
        )
        .where(
            Assessment.assessment_type == "BATTLE",
            Attempt.status.in_(
                [
                    "COMPLETED",
                    "TIME_EXPIRED",
                ]
            ),
        )
    ) or 0

    # --------------------------------------------------------
    # QUESTIONS ANSWERED
    # --------------------------------------------------------

    total_answers = db.scalar(
        select(func.count(Answer.id))
    ) or 0

    correct_answers = db.scalar(
        select(func.count(Answer.id))
        .where(
            Answer.is_correct.is_(True)
        )
    ) or 0

    incorrect_answers = (
        total_answers - correct_answers
    )

    # --------------------------------------------------------
    # AVERAGE SCORE
    # --------------------------------------------------------

    average_score = db.scalar(
        select(
            func.avg(
                Attempt.percentage
            )
        )
        .join(
            Assessment,
            Assessment.id
            == Attempt.assessment_id,
        )
        .where(
            Assessment.assessment_type == "BATTLE",
            Attempt.status.in_(
                [
                    "COMPLETED",
                    "TIME_EXPIRED",
                ]
            ),
        )
    )

    average_score = round(
        float(average_score or 0),
        2,
    )

    # --------------------------------------------------------
    # TOTAL XP
    # --------------------------------------------------------

    total_xp = db.scalar(
        select(
            func.coalesce(
                func.sum(User.xp),
                0,
            )
        )
        .where(
            User.role == "STUDENT"
        )
    ) or 0

    # --------------------------------------------------------
    # ACCURACY
    # --------------------------------------------------------

    accuracy = 0

    if total_answers:
        accuracy = round(
            (
                correct_answers
                / total_answers
            ) * 100,
            2,
        )

    # --------------------------------------------------------
    # DIFFICULTY DISTRIBUTION
    # --------------------------------------------------------

    difficulty_rows = db.execute(
        select(
            Question.difficulty,
            func.count(Question.id),
        )
        .where(
            Question.is_active.is_(True)
        )
        .group_by(
            Question.difficulty
        )
    ).all()

    difficulty_distribution = {
        "EASY": 0,
        "MEDIUM": 0,
        "INTERMEDIATE": 0,
        "HARD": 0,
        "EXPERT": 0,
    }

    for difficulty, count in difficulty_rows:

        if difficulty:
            difficulty_distribution[
                difficulty.upper()
            ] = count

    # --------------------------------------------------------
    # TOP SKILLS BY QUESTION COUNT
    # --------------------------------------------------------

    skill_rows = db.execute(
        select(
            Skill.id,
            Skill.name,
            func.count(Question.id),
        )
        .outerjoin(
            Question,
            (
                Question.skill_id
                == Skill.id
            )
            & (
                Question.is_active.is_(True)
            ),
        )
        .where(
            Skill.is_active.is_(True)
        )
        .group_by(
            Skill.id,
            Skill.name,
        )
        .order_by(
            func.count(
                Question.id
            ).desc()
        )
        .limit(10)
    ).all()

    top_skills = [
        {
            "skill_id": skill_id,
            "skill_name": skill_name,
            "question_count": question_count,
        }
        for (
            skill_id,
            skill_name,
            question_count,
        ) in skill_rows
    ]

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "students": {
            "total": total_students,
            "active": active_students,
        },

        "questions": {
            "total": total_questions,
        },

        "skills": {
            "total": total_skills,
        },

        "quests": {
            "active": active_quests,
        },

        "battles": {
            "generated": total_battles,
            "completed": completed_battles,
        },

        "answers": {
            "total": total_answers,
            "correct": correct_answers,
            "incorrect": incorrect_answers,
            "accuracy": accuracy,
        },

        "average_score": average_score,

        "total_xp": total_xp,

        "difficulty_distribution":
            difficulty_distribution,

        "top_skills": top_skills,
    }