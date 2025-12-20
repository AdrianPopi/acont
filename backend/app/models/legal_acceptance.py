import enum
from datetime import datetime, timezone

from sqlalchemy import (
    String, DateTime, Enum, ForeignKey, Integer, UniqueConstraint, Index
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import func
from app.db.base import Base


class LegalDocType(str, enum.Enum):
    terms = "terms"
    privacy = "privacy"  # (GDPR / Privacy Policy)


class LegalAcceptance(Base):
    __tablename__ = "legal_acceptances"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    doc_type: Mapped[LegalDocType] = mapped_column(
        Enum(LegalDocType, name="legal_doc_type"),
        nullable=False,
        index=True,
    )

    version: Mapped[str] = mapped_column(String(64), nullable=False)

    accepted_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True),
    nullable=False,
    server_default=func.now(),
    index=True,
)

    ip: Mapped[str] = mapped_column(String(64), default="", nullable=False)
    user_agent: Mapped[str] = mapped_column(String(512), default="", nullable=False)
    locale: Mapped[str] = mapped_column(String(16), default="", nullable=False)

    __table_args__ = (
        # 1 accept per user per doc per version (audit-friendly + no duplicates)
        UniqueConstraint("user_id", "doc_type", "version", name="uq_legal_acceptance"),
        Index("ix_legal_acceptances_user_doc", "user_id", "doc_type"),
    )
