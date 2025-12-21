"""add credit notes

Revision ID: 586d5f6b1601
Revises: 7d64a2fa3111
Create Date: 2025-12-21 19:10:19.852554

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '586d5f6b1601'
down_revision: Union[str, Sequence[str], None] = '7d64a2fa3111'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table(
        "credit_notes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("merchant_id", sa.Integer(), nullable=False),
        sa.Column("invoice_id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=True),

        sa.Column("status", sa.Enum("draft","issued","void", name="credit_note_status"), nullable=False, server_default="draft"),

        sa.Column("series", sa.String(length=16), nullable=False, server_default="CN"),
        sa.Column("year", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("number", sa.Integer(), nullable=True),
        sa.Column("credit_note_no", sa.String(length=64), nullable=False, server_default=""),

        sa.Column("issue_date", sa.Date(), nullable=False),

        sa.Column("language", sa.String(length=8), nullable=False, server_default="FR"),
        sa.Column("currency", sa.String(length=8), nullable=False, server_default="EUR"),

        sa.Column("communication_mode", sa.String(length=16), nullable=False, server_default="simple"),
        sa.Column("communication_reference", sa.String(length=64), nullable=False, server_default=""),
        sa.Column("template", sa.String(length=16), nullable=False, server_default="classic"),

        sa.Column("client_name", sa.String(length=256), nullable=False, server_default=""),
        sa.Column("client_email", sa.String(length=256), nullable=False, server_default=""),
        sa.Column("client_tax_id", sa.String(length=64), nullable=False, server_default=""),
        sa.Column("client_address", sa.String(length=512), nullable=False, server_default=""),

        sa.Column("subtotal_net", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("vat_total", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("total_gross", sa.Numeric(12, 2), nullable=False, server_default="0"),

        sa.Column("notes", sa.String(length=1024), nullable=False, server_default=""),

        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=True),

        sa.ForeignKeyConstraint(["merchant_id"], ["merchants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_credit_notes_merchant_id", "credit_notes", ["merchant_id"], unique=False)
    op.create_index("ix_credit_notes_invoice_id", "credit_notes", ["invoice_id"], unique=False)
    op.create_index("ix_credit_notes_client_id", "credit_notes", ["client_id"], unique=False)
    op.create_index("ix_credit_notes_credit_note_no", "credit_notes", ["credit_note_no"], unique=False)
    op.create_index("ix_credit_notes_merchant_status", "credit_notes", ["merchant_id","status"], unique=False)
    op.create_index("ix_credit_notes_merchant_issue_date", "credit_notes", ["merchant_id","issue_date"], unique=False)

    op.create_table(
        "credit_note_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("credit_note_id", sa.Integer(), nullable=False),
        sa.Column("item_code", sa.String(length=64), nullable=False, server_default=""),
        sa.Column("description", sa.String(length=512), nullable=False, server_default=""),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("quantity", sa.Numeric(12, 2), nullable=False, server_default="1"),
        sa.Column("vat_rate", sa.Numeric(6, 2), nullable=False, server_default="0"),
        sa.Column("line_net", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("line_vat", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("line_gross", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["credit_note_id"], ["credit_notes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_credit_note_items_credit_note_id", "credit_note_items", ["credit_note_id"], unique=False)


def downgrade():
    op.drop_index("ix_credit_note_items_credit_note_id", table_name="credit_note_items")
    op.drop_table("credit_note_items")

    op.drop_index("ix_credit_notes_merchant_issue_date", table_name="credit_notes")
    op.drop_index("ix_credit_notes_merchant_status", table_name="credit_notes")
    op.drop_index("ix_credit_notes_credit_note_no", table_name="credit_notes")
    op.drop_index("ix_credit_notes_client_id", table_name="credit_notes")
    op.drop_index("ix_credit_notes_invoice_id", table_name="credit_notes")
    op.drop_index("ix_credit_notes_merchant_id", table_name="credit_notes")
    op.drop_table("credit_notes")

    op.execute("DROP TYPE IF EXISTS credit_note_status")