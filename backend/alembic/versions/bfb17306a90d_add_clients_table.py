"""add clients table

Revision ID: bfb17306a90d
Revises: 3a6744c22bb0
Create Date: 2025-12-20
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "bfb17306a90d"
down_revision: Union[str, Sequence[str], None] = "3a6744c22bb0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "clients",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("merchant_id", sa.Integer(), sa.ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=True),
        sa.Column("tax_id", sa.String(length=64), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_clients_merchant_id", "clients", ["merchant_id"])


def downgrade() -> None:
    op.drop_index("ix_clients_merchant_id", table_name="clients")
    op.drop_table("clients")
