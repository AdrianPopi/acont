from sqlalchemy import Integer, String, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class InvoiceSequence(Base):
    __tablename__ = "invoice_sequences"

    id: Mapped[int] = mapped_column(primary_key=True)

    merchant_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    doc_type: Mapped[str] = mapped_column(String(32), nullable=False, default="invoice")
    next_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    __table_args__ = (
        UniqueConstraint("merchant_id", "year", "doc_type", name="uq_invoice_seq"),
        Index("ix_invoice_seq_lookup", "merchant_id", "year", "doc_type"),
    )
