"""Add suppliers and supplier_invoices tables

Revision ID: g7h8i9j0k1l2
Revises: f6g8h9i0j1k2
Create Date: 2026-01-13

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "g7h8i9j0k1l2"
down_revision: Union[str, None] = "abd4a3961ef7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create suppliers table
    op.create_table(
        "suppliers",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("merchant_id", sa.Integer(), sa.ForeignKey("merchants.id"), index=True, nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(320), nullable=True),
        sa.Column("tax_id", sa.String(50), nullable=True),
        sa.Column("address", sa.String(500), nullable=True),
        sa.Column("peppol_id", sa.String(100), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("contact_person", sa.String(200), nullable=True),
        sa.Column("notes", sa.String(1000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Create supplier_invoices table
    op.create_table(
        "supplier_invoices",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("merchant_id", sa.Integer(), sa.ForeignKey("merchants.id"), index=True, nullable=False),
        sa.Column("supplier_id", sa.Integer(), sa.ForeignKey("suppliers.id"), index=True, nullable=True),
        sa.Column("invoice_no", sa.String(100), nullable=False),
        sa.Column("issue_date", sa.String(20), nullable=False),
        sa.Column("due_date", sa.String(20), nullable=True),
        sa.Column("currency", sa.String(10), server_default="EUR"),
        sa.Column("total_net", sa.String(50), server_default="0.00"),
        sa.Column("total_vat", sa.String(50), server_default="0.00"),
        sa.Column("total_gross", sa.String(50), server_default="0.00"),
        sa.Column("status", sa.String(50), server_default="received"),
        sa.Column("source", sa.String(50), server_default="manual"),
        sa.Column("peppol_message_id", sa.String(200), nullable=True),
        sa.Column("pdf_filename", sa.String(255), nullable=True),
        sa.Column("pdf_path", sa.String(500), nullable=True),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("notes", sa.String(1000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("supplier_invoices")
    op.drop_table("suppliers")
