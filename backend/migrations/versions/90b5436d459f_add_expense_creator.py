"""add expense creator

Revision ID: 90b5436d459f
Revises: fe277b15aff9
Create Date: 2026-11-15 17:06:30.879304
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# Revision identifiers used by Alembic.
revision: str = "90b5436d459f"
down_revision: Union[str, Sequence[str], None] = "fe277b15aff9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add the creator column as nullable first.
    op.add_column(
        "expenses",
        sa.Column(
            "created_by_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    # Backfill existing expenses using the payer as the creator.
    op.execute(
        """
        UPDATE expenses
        SET created_by_id = payer_id
        """
    )

    # Add the foreign key constraint.
    op.create_foreign_key(
        "fk_expenses_created_by_id_users",
        "expenses",
        "users",
        ["created_by_id"],
        ["id"],
    )

    # Make the creator column non-nullable.
    op.alter_column(
        "expenses",
        "created_by_id",
        existing_type=sa.Integer(),
        nullable=False,
    )


def downgrade() -> None:
    # Remove the foreign key constraint.
    op.drop_constraint(
        "fk_expenses_created_by_id_users",
        "expenses",
        type_="foreignkey",
    )

    # Remove the creator column.
    op.drop_column("expenses", "created_by_id")
