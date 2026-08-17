from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_student
from app.db.session import get_db

from app.models.badge import Badge
from app.models.user import User
from app.models.user_badge import UserBadge

from app.schemas.badge import (
    BadgeResponse,
    UserBadgeResponse,
)


router = APIRouter(
    prefix="/badges",
    tags=["Badges"],
)


# ============================================================
# GET ALL AVAILABLE BADGES
# ============================================================

@router.get(
    "",
    response_model=list[BadgeResponse],
)
def get_all_badges(
    db: Session = Depends(get_db),
    _: User = Depends(require_student),
):
    badges = db.scalars(
        select(Badge)
        .order_by(
            Badge.id.asc()
        )
    ).all()

    return badges


# ============================================================
# GET MY EARNED BADGES
# ============================================================

@router.get(
    "/me",
    response_model=list[UserBadgeResponse],
)
def get_my_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    rows = db.execute(
        select(
            UserBadge.id,
            Badge.id,
            Badge.name,
            Badge.description,
            Badge.icon,
            UserBadge.earned_at,
        )
        .join(
            Badge,
            Badge.id == UserBadge.badge_id,
        )
        .where(
            UserBadge.user_id
            == current_user.id
        )
        .order_by(
            UserBadge.earned_at.desc()
        )
    ).all()

    result = []

    for row in rows:

        (
            user_badge_id,
            badge_id,
            name,
            description,
            icon,
            earned_at,
        ) = row

        result.append(
            {
                "id": user_badge_id,
                "badge_id": badge_id,
                "name": name,
                "description": description,
                "icon": icon,
                "earned_at": earned_at,
            }
        )

    return result