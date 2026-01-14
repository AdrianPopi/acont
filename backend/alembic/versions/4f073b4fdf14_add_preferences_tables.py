"""add_preferences_tables

Revision ID: 4f073b4fdf14
Revises: 586d5f6b1601
Create Date: 2026-01-06 01:43:26.273877

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4f073b4fdf14'
down_revision: Union[str, Sequence[str], None] = '586d5f6b1601'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create bank_details table
    op.create_table(
        'bank_details',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('merchant_id', sa.Integer(), nullable=False),
        sa.Column('bank_name', sa.String(), nullable=True),
        sa.Column('account_number', sa.String(), nullable=True),
        sa.Column('bic_code', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['merchant_id'], ['merchants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('merchant_id')
    )
    
    # Create tax_rates table
    op.create_table(
        'tax_rates',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('merchant_id', sa.Integer(), nullable=False),
        sa.Column('percentage', sa.DECIMAL(precision=5, scale=2), nullable=False),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['merchant_id'], ['merchants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create invoice_templates table
    op.create_table(
        'invoice_templates',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('merchant_id', sa.Integer(), nullable=False),
        sa.Column('logo_url', sa.String(), nullable=True),
        sa.Column('background_url', sa.String(), nullable=True),
        sa.Column('font_size', sa.Integer(), nullable=False, server_default='12'),
        sa.Column('background_type', sa.String(), nullable=False, server_default='none'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['merchant_id'], ['merchants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('merchant_id')
    )
    
    # Create subscription_info table
    op.create_table(
        'subscription_info',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('merchant_id', sa.Integer(), nullable=False),
        sa.Column('plan_name', sa.String(), nullable=False),
        sa.Column('plan_type', sa.String(), nullable=False),
        sa.Column('valid_from', sa.DateTime(), nullable=True),
        sa.Column('valid_until', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('max_invoices', sa.Integer(), nullable=True),
        sa.Column('max_clients', sa.Integer(), nullable=True),
        sa.Column('max_products', sa.Integer(), nullable=True),
        sa.Column('features', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['merchant_id'], ['merchants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('merchant_id')
    )
    
    # Create email_expenses table
    op.create_table(
        'email_expenses',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('merchant_id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_encrypted', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('imap_host', sa.String(), nullable=True),
        sa.Column('imap_port', sa.Integer(), nullable=False, server_default='993'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['merchant_id'], ['merchants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create peppol_integration table
    op.create_table(
        'peppol_integration',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('merchant_id', sa.Integer(), nullable=False),
        sa.Column('peppol_id', sa.String(), nullable=True),
        sa.Column('is_integrated', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('integration_status', sa.String(), nullable=False, server_default='not_started'),
        sa.Column('integration_date', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['merchant_id'], ['merchants.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('merchant_id'),
        sa.UniqueConstraint('peppol_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('peppol_integration')
    op.drop_table('email_expenses')
    op.drop_table('subscription_info')
    op.drop_table('invoice_templates')
    op.drop_table('tax_rates')
    op.drop_table('bank_details')
