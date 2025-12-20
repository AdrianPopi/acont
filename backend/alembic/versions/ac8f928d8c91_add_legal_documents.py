from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "ac8f928d8c91"
down_revision = "10de051f9eac"

# ✅ reuse existing enum type
legal_doc_type_enum = postgresql.ENUM(
    "terms", "privacy",
    name="legal_doc_type",
    create_type=False,
)

def upgrade():
    op.create_table(
        "legal_documents",
        sa.Column("id", sa.Integer(), primary_key=True),

        sa.Column("doc_type", legal_doc_type_enum, nullable=False),

        sa.Column("version", sa.String(length=64), nullable=False),
        sa.Column("locale", sa.String(length=16), nullable=False, server_default="en"),

        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("false")),

        # ✅ NULL until publish
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),

        # ✅ allow one or the other
        sa.Column("content_md", sa.Text(), nullable=True),
        sa.Column("content_url", sa.String(length=1024), nullable=True),

        sa.UniqueConstraint("doc_type", "version", "locale", name="uq_legal_doc_type_version_locale"),
    )

    op.create_index("ix_legal_documents_doc_type", "legal_documents", ["doc_type"])
    op.create_index("ix_legal_documents_locale", "legal_documents", ["locale"])
    op.create_index("ix_legal_documents_is_published", "legal_documents", ["is_published"])
    op.create_index("ix_legal_documents_published_at", "legal_documents", ["published_at"])
    op.create_index("ix_legal_docs_published_type_locale", "legal_documents", ["is_published", "doc_type", "locale"])
    op.create_index("ix_legal_docs_type_locale_published_at", "legal_documents", ["doc_type", "locale", "published_at"])


def downgrade():
    op.drop_index("ix_legal_docs_type_locale_published_at", table_name="legal_documents")
    op.drop_index("ix_legal_docs_published_type_locale", table_name="legal_documents")
    op.drop_index("ix_legal_documents_published_at", table_name="legal_documents")
    op.drop_index("ix_legal_documents_is_published", table_name="legal_documents")
    op.drop_index("ix_legal_documents_locale", table_name="legal_documents")
    op.drop_index("ix_legal_documents_doc_type", table_name="legal_documents")
    op.drop_table("legal_documents")
