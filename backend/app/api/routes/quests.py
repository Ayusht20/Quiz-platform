from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_student
from app.db.session import get_db

from app.models.quest import Quest
from app.models.user import User
from app.models.user_quest import UserQuest

from app.schemas.quest import QuestResponse


router = APIRouter(
    prefix="/quests",
    tags=["Quests"],
)


# ============================================================
# GET STUDENT QUESTS
# ============================================================

@router.get(
    "",
    response_model=list[QuestResponse],
)
def get_my_quests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student),
):
    now = datetime.now(timezone.utc)

    quests = db.scalars(
        select(Quest)
        .where(
            Quest.is_active.is_(True),
            (
                Quest.starts_at.is_(None)
                | (Quest.starts_at <= now)
            ),
            (
                Quest.ends_at.is_(None)
                | (Quest.ends_at >= now)
            ),
        )
        .order_by(
            Quest.quest_type.asc(),
            Quest.id.desc(),
        )
    ).all()

    result = []

    for quest in quests:

        user_quest = db.scalar(
            select(UserQuest).where(
                UserQuest.user_id
                == current_user.id,
                UserQuest.quest_id
                == quest.id,
            )
        )

        progress = (
            user_quest.progress
            if user_quest
            else 0
        )

        completed = (
            user_quest.completed
            if user_quest
            else False
        )

        reward_claimed = (
            user_quest.reward_claimed
            if user_quest
            else False
        )

        result.append(
            {
                "id": quest.id,
                "title": quest.title,
                "description": quest.description,
                "quest_type": quest.quest_type,
                "target_type": quest.target_type,
                "target_value": quest.target_value,
                "reward_xp": quest.reward_xp,
                "progress": progress,
                "completed": completed,
                "reward_claimed": reward_claimed,
                "starts_at": quest.starts_at,
                "ends_at": quest.ends_at,
            }
        )

    return result