"""invoice client comm template

Revision ID: 7d64a2fa3111
Revises: 63d4430f5b7d
Create Date: 2025-12-21 18:43:09.382141

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7d64a2fa3111'
down_revision: Union[str, Sequence[str], None] = '63d4430f5b7d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column("invoices", sa.Column("client_id", sa.Integer(), nullable=True))
    op.create_index("ix_invoices_client_id", "invoices", ["client_id"], unique=False)
    op.create_foreign_key(
        "fk_invoices_client_id",
        "invoices",
        "clients",
        ["client_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column("invoices", sa.Column("communication_mode", sa.String(length=16), server_default="simple", nullable=False))
    op.add_column("invoices", sa.Column("communication_reference", sa.String(length=64), server_default="", nullable=False))
    op.add_column("invoices", sa.Column("template", sa.String(length=16), server_default="classic", nullable=False))

    op.alter_column("invoices", "language", server_default="FR")


def downgrade():
    op.alter_column("invoices", "language", server_default=None)

    op.drop_column("invoices", "template")
    op.drop_column("invoices", "communication_reference")
    op.drop_column("invoices", "communication_mode")

    op.drop_constraint("fk_invoices_client_id", "invoices", type_="foreignkey")
    op.drop_index("ix_invoices_client_id", table_name="invoices")
    op.drop_column("invoices", "client_id")