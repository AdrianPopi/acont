"""add_client_and_supplier_invoice_emails

Revision ID: abd4a3961ef7
Revises: 55cd65346ac7
Create Date: 2026-01-13 18:31:50.307489

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'abd4a3961ef7'
down_revision: Union[str, Sequence[str], None] = '55cd65346ac7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add client_invoices_email column
    op.add_column('merchants', sa.Column('client_invoices_email', sa.String(320), nullable=False, server_default=''))
    # Add supplier_invoices_email column
    op.add_column('merchants', sa.Column('supplier_invoices_email', sa.String(320), nullable=False, server_default=''))


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the columns in reverse order
    op.drop_column('merchants', 'supplier_invoices_email')
    op.drop_column('merchants', 'client_invoices_email')
