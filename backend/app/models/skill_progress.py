from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SkillProgress(Base):
    __tablename__ = "skill_progress"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "skill_id",
            name="uq_user_skill_progress",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    skill_id: Mapped[int] = mapped_column(
        ForeignKey(
            "skills.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # ========================================================
    # SKILL XP
    # ========================================================

    xp: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # ========================================================
    # QUESTION STATISTICS
    # ========================================================

    questions_answered: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    questions_correct: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # ========================================================
    # BATTLE STATISTICS
    # ========================================================

    battles_completed: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # ========================================================
    # SKILL STATUS
    # ========================================================

    completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    mastered: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # ========================================================
    # TIMESTAMP
    # ========================================================

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # ========================================================
    # RELATIONSHIPS
    # ========================================================

    user = relationship(
        "User",
    )

    skill = relationship(
        "Skill",
    )