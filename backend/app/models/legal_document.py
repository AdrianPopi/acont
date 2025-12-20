from datetime import datetime, timezone

from sqlalchemy import (
    String, DateTime, Boolean, Integer, Text, UniqueConstraint, Index
)
from sqlalchemy.dialects.postgresql import ENUM as PGEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.legal_acceptance import LegalDocType


class LegalDocument(Base):
    __tablename__ = "legal_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # ✅ reuse existing PG enum type; DON'T create it again
    doc_type: Mapped[LegalDocType] = mapped_column(
        PGEnum(LegalDocType, name="legal_doc_type", create_type=False),
        nullable=False,
        index=True,
    )

    version: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    locale: Mapped[str] = mapped_column(String(16), nullable=False, default="en", index=True)

    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)

    # ✅ NULL until you publish
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    # ✅ allow one or the other
    content_md: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    __table_args__ = (
        UniqueConstraint("doc_type", "version", "locale", name="uq_legal_doc_type_version_locale"),
        Index("ix_legal_docs_published_type_locale", "is_published", "doc_type", "locale"),
        Index("ix_legal_docs_type_locale_published_at", "doc_type", "locale", "published_at"),
    )
