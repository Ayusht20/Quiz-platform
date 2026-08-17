from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ============================================================
# BADGE RESPONSE
# ============================================================

class BadgeResponse(BaseModel):

    id: int

    name: str

    description: str | None

    icon: str | None

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# USER BADGE RESPONSE
# ============================================================

class UserBadgeResponse(BaseModel):

    id: int

    badge_id: int

    name: str

    description: str | None

    icon: str | None

    earned_at: datetime
