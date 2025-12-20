"""add legal_acceptances

Revision ID: 10de051f9eac
Revises: 5a0674d39f26
Create Date: 2025-12-17 10:13:58.401296

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '10de051f9eac'
down_revision: Union[str, Sequence[str], None] = '5a0674d39f26'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table(
        "legal_acceptances",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("doc_type", sa.Enum("terms", "privacy", name="legal_doc_type"), nullable=False),
        sa.Column("version", sa.String(length=64), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("ip", sa.String(length=64), nullable=False, server_default=""),
        sa.Column("user_agent", sa.String(length=512), nullable=False, server_default=""),
        sa.Column("locale", sa.String(length=16), nullable=False, server_default=""),
        sa.UniqueConstraint("user_id", "doc_type", "version", name="uq_legal_acceptance"),
    )

    op.create_index("ix_legal_acceptances_user_id", "legal_acceptances", ["user_id"])
    op.create_index("ix_legal_acceptances_doc_type", "legal_acceptances", ["doc_type"])
    op.create_index("ix_legal_acceptances_accepted_at", "legal_acceptances", ["accepted_at"])
    op.create_index("ix_legal_acceptances_user_doc", "legal_acceptances", ["user_id", "doc_type"])


def downgrade():
    op.drop_index("ix_legal_acceptances_user_doc", table_name="legal_acceptances")
    op.drop_index("ix_legal_acceptances_accepted_at", table_name="legal_acceptances")
    op.drop_index("ix_legal_acceptances_doc_type", table_name="legal_acceptances")
    op.drop_index("ix_legal_acceptances_user_id", table_name="legal_acceptances")
    op.drop_table("legal_acceptances")
    op.execute("DROP TYPE IF EXISTS legal_doc_type")