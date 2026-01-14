"""add products table

Revision ID: 48793fb4d4f6
Revises: 413a6c322a75
Create Date: 2025-12-20 22:45:53.623385

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '48793fb4d4f6'
down_revision: Union[str, Sequence[str], None] = '413a6c322a75'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - create products table."""
    op.create_table(
        'products',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('merchant_id', sa.Integer(), sa.ForeignKey('merchants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=True),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('vat_rate', sa.Numeric(5, 2), nullable=False, server_default='0'),
    )
    op.create_index('ix_products_merchant_id', 'products', ['merchant_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_products_merchant_id', table_name='products')
    op.drop_table('products')
