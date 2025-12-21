import enum
from datetime import date, datetime

from sqlalchemy import (
    String, Integer, Date, DateTime, Enum, ForeignKey,
    Numeric, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class CreditNoteStatus(str, enum.Enum):
    draft = "draft"
    issued = "issued"
    void = "void"


class CreditNote(Base):
    __tablename__ = "credit_notes"

    id: Mapped[int] = mapped_column(primary_key=True)

    merchant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("merchants.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    # ✅ referință către factura creditată
    invoice_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("invoices.id", ondelete="RESTRICT"),
        nullable=False, index=True
    )

    # ✅ client (copiat pentru PDF, plus client_id dacă vrei filtrare)
    client_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("clients.id", ondelete="SET NULL"),
        nullable=True, index=True
    )

    status: Mapped[CreditNoteStatus] = mapped_column(
        Enum(CreditNoteStatus, name="credit_note_status"),
        nullable=False,
        default=CreditNoteStatus.draft,
        index=True,
    )

    # numbering (set only on issue)
    series: Mapped[str] = mapped_column(String(16), nullable=False, default="CN")
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True, default=0)
    number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    credit_note_no: Mapped[str] = mapped_column(String(64), nullable=False, default="", index=True)

    issue_date: Mapped[date] = mapped_column(Date, nullable=False)

    language: Mapped[str] = mapped_column(String(8), nullable=False, default="FR")
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="EUR")

    communication_mode: Mapped[str] = mapped_column(String(16), nullable=False, default="simple")
    communication_reference: Mapped[str] = mapped_column(String(64), nullable=False, default="")

    template: Mapped[str] = mapped_column(String(16), nullable=False, default="classic")

    client_name: Mapped[str] = mapped_column(String(256), nullable=False, default="")
    client_email: Mapped[str] = mapped_column(String(256), nullable=False, default="")
    client_tax_id: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    client_address: Mapped[str] = mapped_column(String(512), nullable=False, default="")

    subtotal_net: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    vat_total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total_gross: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)

    notes: Mapped[str] = mapped_column(String(1024), nullable=False, default="")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    issued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    items = relationship("CreditNoteItem", back_populates="credit_note", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_credit_notes_merchant_status", "merchant_id", "status"),
        Index("ix_credit_notes_merchant_issue_date", "merchant_id", "issue_date"),
        Index("ix_credit_notes_merchant_year_number", "merchant_id", "year", "number"),
    )
