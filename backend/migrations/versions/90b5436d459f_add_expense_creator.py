"""add expense creator

Revision ID: 90b5436d459f
Revises: fe277b15aff9
Create Date: 2026-11-15 17:06:30.879304

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '90b5436d459f'
down_revision: Union[str, Sequence[str], None] = 'fe277b15aff9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. เพิ่ม Column แบบ nullable ชั่วคราว
    op.add_column(
        "expenses",
        sa.Column(
            "created_by_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    # 2. กำหนด Creator ของบิลเก่าให้เท่ากับ Payer
    op.execute(
        """
        UPDATE expenses
        SET created_by_id = payer_id
        """
    )

    # 3. เพิ่ม Foreign Key
    op.create_foreign_key(
        "fk_expenses_created_by_id_users",
        "expenses",
        "users",
        ["created_by_id"],
        ["id"],
    )

    # 4. เปลี่ยน Column เป็น NOT NULL
    op.alter_column(
        "expenses",
        "created_by_id",
        existing_type=sa.Integer(),
        nullable=False,
    )


def downgrade() -> None:
    # 1. ลบ Foreign Key
    op.drop_constraint(
        "fk_expenses_created_by_id_users",
        "expenses",
        type_="foreignkey",
    )

    # 2. ลบ Column
    op.drop_column("expenses", "created_by_id")
