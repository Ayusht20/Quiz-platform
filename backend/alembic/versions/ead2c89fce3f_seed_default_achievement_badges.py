"""Seed default achievement badges

Revision ID: <YOUR_REVISION_ID>
Revises: 1f92d9525aed
Create Date: 2026-08-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "ead2c89fce3f"
down_revision: Union[str, Sequence[str], None] = "1f92d9525aed"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    badges = [
        {
            "name": "First Step",
            "description": "Complete your first battle.",
            "icon": "🥇",
        },
        {
            "name": "Quiz Explorer",
            "description": "Complete 5 battles.",
            "icon": "🧭",
        },
        {
            "name": "Quiz Master",
            "description": "Complete 10 battles.",
            "icon": "🧠",
        },
        {
            "name": "Quiz Legend",
            "description": "Complete 25 battles.",
            "icon": "👑",
        },
        {
            "name": "Quiz Champion",
            "description": "Complete 50 battles.",
            "icon": "🏆",
        },
        {
            "name": "Sharpshooter",
            "description": "Score 100% in a battle.",
            "icon": "🎯",
        },
        {
            "name": "Question Hunter",
            "description": "Answer 25 questions correctly.",
            "icon": "📚",
        },
        {
            "name": "XP Hunter",
            "description": "Earn 1,000 XP.",
            "icon": "🚀",
        },
        {
            "name": "Skill Starter",
            "description": "Complete your first skill.",
            "icon": "🌱",
        },
        {
            "name": "Skill Master",
            "description": "Master your first skill.",
            "icon": "💎",
        },
    ]

    badges_table = sa.table(
        "badges",
        sa.column("name", sa.String),
        sa.column("description", sa.Text),
        sa.column("icon", sa.String),
    )

    for badge in badges:

        existing = op.get_bind().execute(
            sa.text(
                """
                SELECT id
                FROM badges
                WHERE name = :name
                """
            ),
            {
                "name": badge["name"],
            },
        ).first()

        if not existing:
            op.bulk_insert(
                badges_table,
                [badge],
            )


def downgrade() -> None:
    connection = op.get_bind()

    badge_names = [
        "First Step",
        "Quiz Explorer",
        "Quiz Master",
        "Quiz Legend",
        "Quiz Champion",
        "Sharpshooter",
        "Question Hunter",
        "XP Hunter",
        "Skill Starter",
        "Skill Master",
    ]

    connection.execute(
        sa.text(
            """
            DELETE FROM badges
            WHERE name = ANY(:names)
            """
        ),
        {
            "names": badge_names,
        },
    )