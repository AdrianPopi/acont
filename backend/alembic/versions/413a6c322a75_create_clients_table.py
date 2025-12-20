from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "xxxx"
down_revision = "bfb17306a90d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "clients",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "merchant_id",
            sa.Integer(),
            sa.ForeignKey("merchants.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("tax_id", sa.String(length=64), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_index(
        "ix_clients_merchant_id",
        "clients",
        ["merchant_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_clients_merchant_id", table_name="clients")
    op.drop_table("clients")
