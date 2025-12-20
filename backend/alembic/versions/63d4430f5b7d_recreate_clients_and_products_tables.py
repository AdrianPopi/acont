from alembic import op
import sqlalchemy as sa


revision = "XXXXXXXX"
down_revision = "48793fb4d4f6"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "clients",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("merchant_id", sa.Integer(), sa.ForeignKey("merchants.id"), index=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=320)),
        sa.Column("tax_id", sa.String(length=50)),
        sa.Column("address", sa.String(length=500)),
    )

    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("merchant_id", sa.Integer(), sa.ForeignKey("merchants.id"), index=True),
        sa.Column("code", sa.String(length=50)),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=500)),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("vat_rate", sa.Numeric(5, 2), nullable=False, server_default="0"),
    )


def downgrade():
    op.drop_table("products")
    op.drop_table("clients")
