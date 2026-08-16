from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import (
    require_admin,
    require_student,
)

from app.db.session import get_db

from app.models.quest import Quest
from app.models.user import User
from app.models.user_quest import UserQuest

from app.schemas.quest import (
    QuestAdminResponse,
    QuestCreate,
    QuestResponse,
    QuestUpdate,
)


router = APIRouter(
    prefix="/quests",
    tags=["Quests"],
)


# ============================================================
# STUDENT - GET MY ACTIVE QUESTS
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
                UserQuest.user_id == current_user.id,
                UserQuest.quest_id == quest.id,
            )
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
                "progress": (
                    user_quest.progress
                    if user_quest
                    else 0
                ),
                "completed": (
                    user_quest.completed
                    if user_quest
                    else False
                ),
                "reward_claimed": (
                    user_quest.reward_claimed
                    if user_quest
                    else False
                ),
                "starts_at": quest.starts_at,
                "ends_at": quest.ends_at,
            }
        )

    return result


# ============================================================
# ADMIN - GET ALL QUESTS
# ============================================================

@router.get(
    "/admin",
    response_model=list[QuestAdminResponse],
)
def get_all_quests(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    quests = db.scalars(
        select(Quest)
        .order_by(
            Quest.id.desc()
        )
    ).all()

    return quests


# ============================================================
# ADMIN - CREATE QUEST
# ============================================================

@router.post(
    "/admin",
    response_model=QuestAdminResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_quest(
    data: QuestCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):

    # --------------------------------------------------------
    # Validate dates
    # --------------------------------------------------------

    if (
        data.starts_at
        and data.ends_at
        and data.ends_at <= data.starts_at
    ):
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time.",
        )

    # --------------------------------------------------------
    # Create quest
    # --------------------------------------------------------

    quest = Quest(
        title=data.title,
        description=data.description,
        quest_type=data.quest_type.upper(),
        target_type=data.target_type.upper(),
        target_value=data.target_value,
        reward_xp=data.reward_xp,
        is_active=True,
        starts_at=data.starts_at,
        ends_at=data.ends_at,
    )

    db.add(quest)

    db.commit()

    db.refresh(quest)

    return quest


# ============================================================
# ADMIN - UPDATE QUEST
# ============================================================

@router.patch(
    "/admin/{quest_id}",
    response_model=QuestAdminResponse,
)
def update_quest(
    quest_id: int,
    data: QuestUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):

    quest = db.get(
        Quest,
        quest_id,
    )

    if not quest:
        raise HTTPException(
            status_code=404,
            detail="Quest not found.",
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():

        if field in {
            "quest_type",
            "target_type",
        } and isinstance(value, str):

            value = value.upper()

        setattr(
            quest,
            field,
            value,
        )

    # --------------------------------------------------------
    # Validate updated dates
    # --------------------------------------------------------

    if (
        quest.starts_at
        and quest.ends_at
        and quest.ends_at <= quest.starts_at
    ):
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time.",
        )

    db.commit()

    db.refresh(quest)

    return quest


# ============================================================
# ADMIN - DEACTIVATE QUEST
# ============================================================

@router.delete(
    "/admin/{quest_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_quest(
    quest_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):

    quest = db.get(
        Quest,
        quest_id,
    )

    if not quest:
        raise HTTPException(
            status_code=404,
            detail="Quest not found.",
        )

    # --------------------------------------------------------
    # Soft delete
    # --------------------------------------------------------

    quest.is_active = False

    db.commit()

    return None