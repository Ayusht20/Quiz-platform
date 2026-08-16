from datetime import datetime

from pydantic import BaseModel, ConfigDict


class QuestResponse(BaseModel):
    id: int
    title: str
    description: str | None

    quest_type: str
    target_type: str
    target_value: int
    reward_xp: int

    progress: int
    completed: bool
    reward_claimed: bool

    starts_at: datetime | None
    ends_at: datetime | None

    model_config = ConfigDict(
        from_attributes=True
    )