import enum
from sqlalchemy import JSON, Boolean, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.db.base import Base

class LinkStatus(str, enum.Enum):
    pending = "PENDING"
    active = "ACTIVE"
    revoked = "REVOKED"

class MerchantAccountantLink(Base):
    __tablename__ = "merchant_links"

    id: Mapped[int] = mapped_column(primary_key=True)
    merchant_id: Mapped[int] = mapped_column(index=True, nullable=False)

    status: Mapped[LinkStatus] = mapped_column(Enum(LinkStatus), default=LinkStatus.pending, nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    permissions_json: Mapped[dict] = mapped_column(JSON, default=lambda: {
        "read_only": True,
        "validate": True,
        "export": True,
        "manage_deviz_meta": False
    }, nullable=False)

    invited_by_user_id: Mapped[int | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
