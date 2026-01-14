"""add template_style to invoice_templates

Revision ID: f6g8h9i0j1k2
Revises: e5f7g8h9i0j1
Create Date: 2026-01-09 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6g8h9i0j1k2'
down_revision: Union[str, Sequence[str], None] = 'e5f7g8h9i0j1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add template_style column to invoice_templates table
    op.add_column('invoice_templates', sa.Column('template_style', sa.String(), nullable=False, server_default='classic'))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove template_style column
    op.drop_column('invoice_templates', 'template_style')
