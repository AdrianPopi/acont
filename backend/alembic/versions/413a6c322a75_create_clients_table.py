from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "413a6c322a75"
down_revision = "bfb17306a90d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Clients table already created in bfb17306a90d - no-op
    pass


def downgrade() -> None:
    # No-op
    pass
