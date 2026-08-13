from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User


router = APIRouter(
    prefix="/leaderboard",
    tags=["Leaderboard"],
)


@router.get("")
def get_leaderboard(
    db: Session = Depends(get_db),
):
    users = db.scalars(
        select(User)
        .where(
            User.status == "ACTIVE",
            User.role == "STUDENT",
        )
        .order_by(
            User.xp.desc(),
            User.level.desc(),
        )
        .limit(100)
    ).all()

    return [
        {
            "rank": index + 1,
            "user_id": user.id,
            "name": user.name,
            "xp": user.xp,
            "level": user.level,
        }
        for index, user in enumerate(users)
    ]