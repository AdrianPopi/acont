"""add invoices

Revision ID: 8bd125f848fd
Revises: ac8f928d8c91
Create Date: 2025-12-19 02:49:42.009937
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "8bd125f848fd"
down_revision: Union[str, Sequence[str], None] = "ac8f928d8c91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create the linkstatus enum type first (only if not exists)
    linkstatus = postgresql.ENUM(
        "pending",
        "active",
        "revoked",
        name="linkstatus",
        create_type=False,
    )
    # Try to create the type, ignore if exists
    try:
        linkstatus.create(op.get_bind(), checkfirst=True)
    except Exception:
        pass  # Type already exists

    op.create_table(
        "invoice_sequences",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("merchant_id", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("doc_type", sa.String(length=32), nullable=False),
        sa.Column("next_number", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("merchant_id", "year", "doc_type", name="uq_invoice_seq"),
    )
    op.create_index(
        "ix_invoice_seq_lookup",
        "invoice_sequences",
        ["merchant_id", "year", "doc_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_invoice_sequences_merchant_id"),
        "invoice_sequences",
        ["merchant_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_invoice_sequences_year"),
        "invoice_sequences",
        ["year"],
        unique=False,
    )

    op.create_table(
        "merchant_links",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("merchant_id", sa.Integer(), nullable=False),
        sa.Column("status", linkstatus, nullable=False),
        sa.Column("is_primary", sa.Boolean(), nullable=False),
        sa.Column("permissions_json", sa.JSON(), nullable=False),
        sa.Column("invited_by_user_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_merchant_links_merchant_id"),
        "merchant_links",
        ["merchant_id"],
        unique=False,
    )

    op.create_table(
        "invoices",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("merchant_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("draft", "issued", "paid", "void", name="invoice_status"),
            nullable=False,
        ),
        sa.Column("series", sa.String(length=16), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("number", sa.Integer(), nullable=True),
        sa.Column("invoice_no", sa.String(length=64), nullable=False),
        sa.Column("issue_date", sa.Date(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("language", sa.String(length=8), nullable=False),
        sa.Column("currency", sa.String(length=8), nullable=False),
        sa.Column("client_name", sa.String(length=256), nullable=False),
        sa.Column("client_email", sa.String(length=256), nullable=False),
        sa.Column("client_tax_id", sa.String(length=64), nullable=False),
        sa.Column("client_address", sa.String(length=512), nullable=False),
        sa.Column("discount_percent", sa.Numeric(precision=6, scale=2), nullable=False),
        sa.Column("advance_paid", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("subtotal_net", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("vat_total", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("total_gross", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("notes", sa.String(length=1024), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["merchant_id"], ["merchants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_invoices_invoice_no"), "invoices", ["invoice_no"], unique=False)
    op.create_index(op.f("ix_invoices_merchant_id"), "invoices", ["merchant_id"], unique=False)
    op.create_index("ix_invoices_merchant_issue_date", "invoices", ["merchant_id", "issue_date"], unique=False)
    op.create_index("ix_invoices_merchant_status", "invoices", ["merchant_id", "status"], unique=False)
    op.create_index(op.f("ix_invoices_status"), "invoices", ["status"], unique=False)
    op.create_index(op.f("ix_invoices_year"), "invoices", ["year"], unique=False)

    op.create_table(
        "invoice_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("invoice_id", sa.Integer(), nullable=False),
        sa.Column("item_code", sa.String(length=64), nullable=False),
        sa.Column("description", sa.String(length=512), nullable=False),
        sa.Column("unit_price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("vat_rate", sa.Numeric(precision=6, scale=2), nullable=False),
        sa.Column("line_net", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("line_vat", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("line_gross", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.ForeignKeyConstraint(["invoice_id"], ["invoices.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_invoice_items_invoice_id", "invoice_items", ["invoice_id"], unique=False)

    # drop old accountant tables (using raw SQL with IF EXISTS)
    op.execute("DROP INDEX IF EXISTS ix_merchant_accountant_links_accountant_id")
    op.execute("DROP INDEX IF EXISTS ix_merchant_accountant_links_merchant_id")
    op.execute("DROP TABLE IF EXISTS merchant_accountant_links")
    op.execute("DROP INDEX IF EXISTS ix_accountants_user_id")
    op.execute("DROP TABLE IF EXISTS accountants")

    op.create_index(op.f("ix_legal_documents_version"), "legal_documents", ["version"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # IMPORTANT: do not drop enum type linkstatus (it may be reused elsewhere)
    linkstatus = postgresql.ENUM(
        "pending",
        "active",
        "revoked",
        name="linkstatus",
        create_type=False,
    )

    op.drop_index(op.f("ix_legal_documents_version"), table_name="legal_documents")

    op.create_table(
        "accountants",
        sa.Column("id", sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("display_name", sa.VARCHAR(length=200), autoincrement=False, nullable=False),
        sa.Column("email_invoices_out", sa.VARCHAR(length=320), autoincrement=False, nullable=False),
        sa.Column("email_invoices_in", sa.VARCHAR(length=320), autoincrement=False, nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("accountants_pkey")),
    )
    op.create_index(op.f("ix_accountants_user_id"), "accountants", ["user_id"], unique=True)

    op.create_table(
        "merchant_accountant_links",
        sa.Column("id", sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column("merchant_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("accountant_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("status", linkstatus, autoincrement=False, nullable=False),
        sa.Column("is_primary", sa.BOOLEAN(), autoincrement=False, nullable=False),
        sa.Column("permissions_json", postgresql.JSON(astext_type=sa.Text()), autoincrement=False, nullable=False),
        sa.Column("invited_by_user_id", sa.INTEGER(), autoincrement=False, nullable=True),
        sa.Column("created_at", postgresql.TIMESTAMP(), autoincrement=False, nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("merchant_accountant_links_pkey")),
    )
    op.create_index(op.f("ix_merchant_accountant_links_merchant_id"), "merchant_accountant_links", ["merchant_id"], unique=False)
    op.create_index(op.f("ix_merchant_accountant_links_accountant_id"), "merchant_accountant_links", ["accountant_id"], unique=False)

    op.drop_index("ix_invoice_items_invoice_id", table_name="invoice_items")
    op.drop_table("invoice_items")

    op.drop_index(op.f("ix_invoices_year"), table_name="invoices")
    op.drop_index(op.f("ix_invoices_status"), table_name="invoices")
    op.drop_index("ix_invoices_merchant_status", table_name="invoices")
    op.drop_index("ix_invoices_merchant_issue_date", table_name="invoices")
    op.drop_index(op.f("ix_invoices_merchant_id"), table_name="invoices")
    op.drop_index(op.f("ix_invoices_invoice_no"), table_name="invoices")
    op.drop_table("invoices")

    op.drop_index(op.f("ix_merchant_links_merchant_id"), table_name="merchant_links")
    op.drop_table("merchant_links")

    op.drop_index(op.f("ix_invoice_sequences_year"), table_name="invoice_sequences")
    op.drop_index(op.f("ix_invoice_sequences_merchant_id"), table_name="invoice_sequences")
    op.drop_index("ix_invoice_seq_lookup", table_name="invoice_sequences")
    op.drop_table("invoice_sequences")
