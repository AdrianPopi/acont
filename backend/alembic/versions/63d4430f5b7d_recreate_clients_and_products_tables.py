from alembic import op
import sqlalchemy as sa


revision = "63d4430f5b7d"
down_revision = "48793fb4d4f6"
branch_labels = None
depends_on = None


def upgrade():
    # Tables already created in previous migrations - no-op
    pass


def downgrade():
    pass
