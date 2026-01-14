from sqlalchemy import String, Date, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
from app.db.base import Base

class Merchant(Base):
    __tablename__ = "merchants"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_user_id: Mapped[int] = mapped_column(index=True, nullable=False)

    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    cui: Mapped[str] = mapped_column(String(32), default="", nullable=False)
    vat_id: Mapped[str] = mapped_column(String(32), default="", nullable=False)
    phone: Mapped[str] = mapped_column(String(32), default="", nullable=False)
    communication_email: Mapped[str] = mapped_column(String(320), default="", nullable=False)
    
    # Email for invoices sent to clients (outgoing)
    client_invoices_email: Mapped[str] = mapped_column(String(320), default="", nullable=False)
    # Email for invoices received from suppliers (incoming)
    supplier_invoices_email: Mapped[str] = mapped_column(String(320), default="", nullable=False)

    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    country_code: Mapped[str] = mapped_column(String(2), default="RO", nullable=False)
    jurisdiction: Mapped[str] = mapped_column(String(8), default="RO", nullable=False)

    closed_until_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    settings_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Relationships to preferences
    bank_details = relationship("BankDetails", back_populates="merchant", uselist=False, cascade="all, delete-orphan")
    tax_rates = relationship("TaxRate", back_populates="merchant", cascade="all, delete-orphan")
    invoice_template = relationship("InvoiceTemplate", back_populates="merchant", uselist=False, cascade="all, delete-orphan")
    subscription_info = relationship("SubscriptionInfo", back_populates="merchant", uselist=False, cascade="all, delete-orphan")
    calendar_events = relationship("CalendarEvent", back_populates="merchant", cascade="all, delete-orphan")
    email_expenses = relationship("EmailExpenses", back_populates="merchant", cascade="all, delete-orphan")
    peppol_integration = relationship("PeppolIntegration", back_populates="merchant", uselist=False, cascade="all, delete-orphan")
    
    # Stripe subscription
    subscription = relationship("Subscription", back_populates="merchant", uselist=False, cascade="all, delete-orphan")
