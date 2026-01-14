"""add peppol transmission tracking

Revision ID: e5f7g8h9i0j1
Revises: d4e8f3a1b2c5
Create Date: 2026-01-09 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f7g8h9i0j1'
down_revision: Union[str, Sequence[str], None] = 'd4e8f3a1b2c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add peppol_id to clients table
    op.add_column('clients', sa.Column('peppol_id', sa.String(100), nullable=True))
    
    # Add transmission tracking columns to invoices table
    op.add_column('invoices', sa.Column('client_peppol_id', sa.String(100), nullable=False, server_default=''))
    op.add_column('invoices', sa.Column('transmission_method', sa.String(20), nullable=False, server_default='email'))
    op.add_column('invoices', sa.Column('sent_via_email', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('invoices', sa.Column('sent_via_peppol', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('invoices', sa.Column('peppol_sent_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('invoices', sa.Column('email_sent_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove columns from invoices
    op.drop_column('invoices', 'email_sent_at')
    op.drop_column('invoices', 'peppol_sent_at')
    op.drop_column('invoices', 'sent_via_peppol')
    op.drop_column('invoices', 'sent_via_email')
    op.drop_column('invoices', 'transmission_method')
    op.drop_column('invoices', 'client_peppol_id')
    
    # Remove peppol_id from clients
    op.drop_column('clients', 'peppol_id')
