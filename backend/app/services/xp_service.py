from sqlalchemy.orm import Session

from app.models.level import Level
from app.models.user import User
from app.models.xp_transaction import XPTransaction


def calculate_xp(
    percentage: float,
    difficulty: str,
) -> int:
    base_xp = {
        "BEGINNER": 50,
        "EASY": 75,
        "INTERMEDIATE": 100,
        "HARD": 150,
        "EXPERT": 200,
    }.get(difficulty.upper(), 50)

    performance_multiplier = percentage / 100

    return max(
        10,
        round(base_xp * performance_multiplier),
    )


def award_xp(
    db: Session,
    user: User,
    amount: int,
    reason: str,
) -> None:
    user.xp += amount

    transaction = XPTransaction(
        user_id=user.id,
        amount=amount,
        reason=reason,
    )

    db.add(transaction)

    # Find highest level the user has reached.
    level = db.query(Level).filter(
        Level.required_xp <= user.xp
    ).order_by(
        Level.level_number.desc()
    ).first()

    if level:
        user.level = level.level_number