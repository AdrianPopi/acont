"""add phone and communication_email to merchant

Revision ID: d4e8f3a1b2c5
Revises: 4f073b4fdf14
Create Date: 2026-01-08 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e8f3a1b2c5'
down_revision: Union[str, Sequence[str], None] = '4f073b4fdf14'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add phone and communication_email columns to merchants table."""
    op.add_column('merchants', sa.Column('phone', sa.String(length=32), nullable=False, server_default=''))
    op.add_column('merchants', sa.Column('communication_email', sa.String(length=320), nullable=False, server_default=''))


def downgrade() -> None:
    """Remove phone and communication_email columns from merchants table."""
    op.drop_column('merchants', 'communication_email')
    op.drop_column('merchants', 'phone')
