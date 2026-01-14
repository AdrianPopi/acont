"""add_calendar_events_table

Revision ID: 55cd65346ac7
Revises: f6g8h9i0j1k2
Create Date: 2026-01-13 17:38:57.378250

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '55cd65346ac7'
down_revision: Union[str, Sequence[str], None] = 'f6g8h9i0j1k2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'calendar_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('event_type', sa.Enum('meeting', 'deadline', 'reminder', 'invoice_due', 'payment', 'other', name='eventtype'), nullable=False),
        sa.Column('start_datetime', sa.DateTime(), nullable=False),
        sa.Column('end_datetime', sa.DateTime(), nullable=True),
        sa.Column('all_day', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('merchant_id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=True),
        sa.Column('invoice_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=True, onupdate=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['merchant_id'], ['merchants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ondelete='SET NULL')
    )
    op.create_index(op.f('ix_calendar_events_id'), 'calendar_events', ['id'], unique=False)
    op.create_index(op.f('ix_calendar_events_merchant_id'), 'calendar_events', ['merchant_id'], unique=False)
    op.create_index(op.f('ix_calendar_events_start_datetime'), 'calendar_events', ['start_datetime'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_calendar_events_start_datetime'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_merchant_id'), table_name='calendar_events')
    op.drop_index(op.f('ix_calendar_events_id'), table_name='calendar_events')
    op.drop_table('calendar_events')
