from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db.session import get_db

from app.models.user import User
from app.models.question import Question
from app.models.skill import Skill
from app.models.quest import Quest
from app.models.assessment import Assessment
from app.models.attempt import Attempt
from app.models.answer import Answer


router = APIRouter(
    prefix="/admin/dashboard",
    tags=["Admin Dashboard"],
)


# ============================================================
# ADMIN DASHBOARD STATISTICS
# ============================================================

@router.get("/stats")
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    # --------------------------------------------------------
    # TOTAL STUDENTS
    # --------------------------------------------------------

    total_students = db.scalar(
        select(func.count(User.id))
        .where(
            User.role == "STUDENT"
        )
    ) or 0

    # --------------------------------------------------------
    # TOTAL QUESTIONS
    # --------------------------------------------------------

    total_questions = db.scalar(
        select(func.count(Question.id))
        .where(
            Question.is_active.is_(True)
        )
    ) or 0

    # --------------------------------------------------------
    # TOTAL SKILLS
    # --------------------------------------------------------

    total_skills = db.scalar(
        select(func.count(Skill.id))
        .where(
            Skill.is_active.is_(True)
        )
    ) or 0

    # --------------------------------------------------------
    # ACTIVE QUESTS
    # --------------------------------------------------------

    active_quests = db.scalar(
        select(func.count(Quest.id))
        .where(
            Quest.is_active.is_(True)
        )
    ) or 0

    # --------------------------------------------------------
    # TOTAL BATTLES GENERATED
    #
    # A battle is an automatically generated assessment
    # whose assessment_type is BATTLE.
    # --------------------------------------------------------

    total_battles = db.scalar(
        select(func.count(Assessment.id))
        .where(
            Assessment.assessment_type == "BATTLE"
        )
    ) or 0

    # --------------------------------------------------------
    # COMPLETED BATTLES
    # --------------------------------------------------------

    completed_battles = db.scalar(
        select(func.count(Attempt.id))
        .join(
            Assessment,
            Assessment.id == Attempt.assessment_id,
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
    # TOTAL QUESTIONS ANSWERED
    # --------------------------------------------------------

    total_answers = db.scalar(
        select(func.count(Answer.id))
    ) or 0

    # --------------------------------------------------------
    # CORRECT ANSWERS
    # --------------------------------------------------------

    total_correct_answers = db.scalar(
        select(func.count(Answer.id))
        .where(
            Answer.is_correct.is_(True)
        )
    ) or 0

    # --------------------------------------------------------
    # AVERAGE BATTLE SCORE
    # --------------------------------------------------------

    average_percentage = db.scalar(
        select(
            func.avg(
                Attempt.percentage
            )
        )
        .join(
            Assessment,
            Assessment.id == Attempt.assessment_id,
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

    average_percentage = round(
        float(average_percentage or 0),
        2,
    )

    # --------------------------------------------------------
    # TOTAL XP CURRENTLY HELD BY STUDENTS
    #
    # This is NOT historical XP distribution.
    # It represents the current XP balance of students.
    # --------------------------------------------------------

    total_student_xp = db.scalar(
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
    # BATTLE ACCURACY
    # --------------------------------------------------------

    accuracy = 0

    if total_answers > 0:
        accuracy = round(
            (
                total_correct_answers
                / total_answers
            ) * 100,
            2,
        )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "total_students": total_students,
        "total_questions": total_questions,
        "total_skills": total_skills,
        "active_quests": active_quests,

        "total_battles": total_battles,
        "completed_battles": completed_battles,

        "total_answers": total_answers,
        "total_correct_answers": total_correct_answers,

        "average_percentage": average_percentage,
        "accuracy": accuracy,

        "total_student_xp": total_student_xp,
    }