from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.attempt import Attempt
from app.models.badge import Badge
from app.models.user_badge import UserBadge


def check_badges(
    db: Session,
    user_id: int,
):
    completed_count = db.query(Attempt).filter(
        Attempt.user_id == user_id,
        Attempt.status.in_(
            ["COMPLETED", "TIME_EXPIRED"]
        ),
    ).count()

    badge_rules = [
        ("First Step", 1),
        ("Quiz Explorer", 5),
        ("Quiz Master", 10),
        ("Quiz Legend", 25),
        ("Quiz Champion", 50),
    ]

    for badge_name, required_count in badge_rules:

        if completed_count < required_count:
            continue

        badge = db.query(Badge).filter(
            Badge.name == badge_name
        ).first()

        if not badge:
            continue

        existing = db.query(UserBadge).filter(
            UserBadge.user_id == user_id,
            UserBadge.badge_id == badge.id,
        ).first()

        if not existing:
            db.add(
                UserBadge(
                    user_id=user_id,
                    badge_id=badge.id,
                )
            )

    db.commit()