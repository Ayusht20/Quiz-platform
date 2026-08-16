"""Add skill completion and mastery

Revision ID: 1f92d9525aed
Revises: 22ee83e2b3b0
Create Date: 2026-08-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1f92d9525aed"
down_revision: Union[str, Sequence[str], None] = "22ee83e2b3b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # --------------------------------------------------------
    # Add columns with temporary defaults.
    #
    # Existing SkillProgress rows will automatically receive
    # False instead of NULL.
    # --------------------------------------------------------

    op.add_column(
        "skill_progress",
        sa.Column(
            "completed",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.add_column(
        "skill_progress",
        sa.Column(
            "mastered",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    # --------------------------------------------------------
    # Remove the database-level defaults.
    #
    # SQLAlchemy already supplies Python defaults for new
    # SkillProgress objects, so we don't need permanent
    # PostgreSQL defaults.
    # --------------------------------------------------------

    op.alter_column(
        "skill_progress",
        "completed",
        server_default=None,
    )

    op.alter_column(
        "skill_progress",
        "mastered",
        server_default=None,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column(
        "skill_progress",
        "mastered",
    )

    op.drop_column(
        "skill_progress",
        "completed",
    )