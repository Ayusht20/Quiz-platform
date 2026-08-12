from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Attempt(Base):
    __tablename__ = "attempts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    assessment_id: Mapped[int] = mapped_column(
        ForeignKey("assessments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    percentage: Mapped[float] = mapped_column(default=0, nullable=False)

    correct_answers: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )

    incorrect_answers: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )

    unanswered: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )

    time_taken_seconds: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="IN_PROGRESS",
        nullable=False,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    answers = relationship(
        "Answer",
        back_populates="attempt",
        cascade="all, delete-orphan",
    )

    user = relationship("User")
    assessment = relationship("Assessment")