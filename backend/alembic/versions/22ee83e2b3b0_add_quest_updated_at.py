"""Add quest updated at

Revision ID: 22ee83e2b3b0
Revises: 5caa9496f17d
Create Date: 2026-08-16 16:37:51.949687

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "22ee83e2b3b0"
down_revision: Union[str, Sequence[str], None] = "5caa9496f17d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        "quests",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.add_column(
        "user_quests",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column(
        "user_quests",
        "updated_at",
    )

    op.drop_column(
        "quests",
        "updated_at",
    )