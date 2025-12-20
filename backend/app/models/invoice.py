import enum
from datetime import date, datetime

from sqlalchemy import (
    String, Integer, Date, DateTime, Enum, ForeignKey,
    Numeric, UniqueConstraint, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class InvoiceStatus(str, enum.Enum):
    draft = "draft"
    issued = "issued"
    paid = "paid"
    void = "void"


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True)

    merchant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("merchants.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    status: Mapped[InvoiceStatus] = mapped_column(
        Enum(InvoiceStatus, name="invoice_status"),
        nullable=False,
        default=InvoiceStatus.draft,
        index=True,
    )

    # numbering (set only on issue)
    series: Mapped[str] = mapped_column(String(16), nullable=False, default="INV")
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True, default=0)
    number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    invoice_no: Mapped[str] = mapped_column(String(64), nullable=False, default="", index=True)

    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    language: Mapped[str] = mapped_column(String(8), nullable=False, default="fr")  # fr/en/nl
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="EUR")

    client_name: Mapped[str] = mapped_column(String(256), nullable=False, default="")
    client_email: Mapped[str] = mapped_column(String(256), nullable=False, default="")
    client_tax_id: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    client_address: Mapped[str] = mapped_column(String(512), nullable=False, default="")

    discount_percent: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False, default=0)
    advance_paid: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)

    subtotal_net: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    vat_total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total_gross: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)

    notes: Mapped[str] = mapped_column(String(1024), nullable=False, default="")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    issued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_invoices_merchant_status", "merchant_id", "status"),
        Index("ix_invoices_merchant_issue_date", "merchant_id", "issue_date"),
    )
