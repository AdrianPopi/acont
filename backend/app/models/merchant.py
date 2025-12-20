from sqlalchemy import String, Date, JSON
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date
from app.db.base import Base

class Merchant(Base):
    __tablename__ = "merchants"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_user_id: Mapped[int] = mapped_column(index=True, nullable=False)

    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    cui: Mapped[str] = mapped_column(String(32), default="", nullable=False)
    vat_id: Mapped[str] = mapped_column(String(32), default="", nullable=False)

    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    country_code: Mapped[str] = mapped_column(String(2), default="RO", nullable=False)
    jurisdiction: Mapped[str] = mapped_column(String(8), default="RO", nullable=False)

    closed_until_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    settings_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
