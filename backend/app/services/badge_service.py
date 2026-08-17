from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.attempt import Attempt
from app.models.badge import Badge
from app.models.skill_progress import SkillProgress
from app.models.user import User
from app.models.user_badge import UserBadge


def _award_badge(
    db: Session,
    user_id: int,
    badge_name: str,
):
    """
    Award a badge if:

    1. The badge exists.
    2. The user has not already earned it.
    """

    badge = (
        db.query(Badge)
        .filter(
            Badge.name == badge_name
        )
        .first()
    )

    if not badge:
        return

    existing = (
        db.query(UserBadge)
        .filter(
            UserBadge.user_id == user_id,
            UserBadge.badge_id == badge.id,
        )
        .first()
    )

    if existing:
        return

    db.add(
        UserBadge(
            user_id=user_id,
            badge_id=badge.id,
        )
    )


def check_badges(
    db: Session,
    user_id: int,
):
    """
    Check all achievement conditions for a user.

    This function is intentionally safe to call
    after every battle submission.
    """

    # ========================================================
    # USER
    # ========================================================

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:
        return

    # ========================================================
    # BATTLE COUNT
    # ========================================================

    completed_count = (
        db.query(Attempt)
        .filter(
            Attempt.user_id == user_id,
            Attempt.status.in_(
                [
                    "COMPLETED",
                    "TIME_EXPIRED",
                ]
            ),
        )
        .count()
    )

    # ========================================================
    # BATTLE ACHIEVEMENTS
    # ========================================================

    battle_badges = [
        (
            "First Step",
            1,
        ),
        (
            "Quiz Explorer",
            5,
        ),
        (
            "Quiz Master",
            10,
        ),
        (
            "Quiz Legend",
            25,
        ),
        (
            "Quiz Champion",
            50,
        ),
    ]

    for badge_name, required_count in battle_badges:

        if completed_count >= required_count:

            _award_badge(
                db=db,
                user_id=user_id,
                badge_name=badge_name,
            )

    # ========================================================
    # PERFECT SCORE
    # ========================================================

    perfect_battle = (
        db.query(Attempt)
        .filter(
            Attempt.user_id == user_id,
            Attempt.status == "COMPLETED",
            Attempt.percentage >= 100,
        )
        .first()
    )

    if perfect_battle:

        _award_badge(
            db=db,
            user_id=user_id,
            badge_name="Sharpshooter",
        )

    # ========================================================
    # TOTAL CORRECT ANSWERS
    # ========================================================

    total_correct = (
        db.query(
            func.coalesce(
                func.sum(
                    Attempt.correct_answers
                ),
                0,
            )
        )
        .filter(
            Attempt.user_id == user_id,
            Attempt.status.in_(
                [
                    "COMPLETED",
                    "TIME_EXPIRED",
                ]
            ),
        )
        .scalar()
    )

    if total_correct >= 25:

        _award_badge(
            db=db,
            user_id=user_id,
            badge_name="Question Hunter",
        )

    # ========================================================
    # XP ACHIEVEMENT
    # ========================================================

    if (user.xp or 0) >= 1000:

        _award_badge(
            db=db,
            user_id=user_id,
            badge_name="XP Hunter",
        )

    # ========================================================
    # SKILL COMPLETION
    # ========================================================

    completed_skill = (
        db.query(SkillProgress)
        .filter(
            SkillProgress.user_id == user_id,
            SkillProgress.completed.is_(True),
        )
        .first()
    )

    if completed_skill:

        _award_badge(
            db=db,
            user_id=user_id,
            badge_name="Skill Starter",
        )

    # ========================================================
    # SKILL MASTERY
    # ========================================================

    mastered_skill = (
        db.query(SkillProgress)
        .filter(
            SkillProgress.user_id == user_id,
            SkillProgress.mastered.is_(True),
        )
        .first()
    )

    if mastered_skill:

        _award_badge(
            db=db,
            user_id=user_id,
            badge_name="Skill Master",
        )

    # ========================================================
    # SAVE
    # ========================================================

    db.commit()