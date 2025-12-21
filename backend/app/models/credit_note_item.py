from sqlalchemy import String, Integer, ForeignKey, Numeric, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class CreditNoteItem(Base):
    __tablename__ = "credit_note_items"

    id: Mapped[int] = mapped_column(primary_key=True)

    credit_note_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("credit_notes.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    item_code: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    description: Mapped[str] = mapped_column(String(512), nullable=False, default="")

    unit_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    quantity: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=1)
    vat_rate: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False, default=0)

    # ✅ sume NEGATIVE (storno)
    line_net: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    line_vat: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    line_gross: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)

    credit_note = relationship("CreditNote", back_populates="items")

    __table_args__ = (
        Index("ix_credit_note_items_credit_note_id", "credit_note_id"),
    )
