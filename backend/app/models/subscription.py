"""
Subscription model for Stripe integration.
"""
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Enum, Integer, ForeignKey, Numeric, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class SubscriptionPlan(str, enum.Enum):
    """Available subscription plans."""
    free_trial = "free_trial"
    starter = "starter"
    pro = "pro"
    enterprise = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    """Subscription status from Stripe."""
    trialing = "trialing"
    active = "active"
    past_due = "past_due"
    canceled = "canceled"
    unpaid = "unpaid"
    incomplete = "incomplete"
    incomplete_expired = "incomplete_expired"


class BillingInterval(str, enum.Enum):
    """Billing interval."""
    monthly = "monthly"
    yearly = "yearly"


class Subscription(Base):
    """
    Tracks merchant subscriptions.
    """
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"), nullable=False, unique=True)
    
    # Stripe IDs
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stripe_price_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Plan details
    plan: Mapped[SubscriptionPlan] = mapped_column(
        Enum(SubscriptionPlan), 
        default=SubscriptionPlan.free_trial,
        nullable=False
    )
    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus),
        default=SubscriptionStatus.trialing,
        nullable=False
    )
    billing_interval: Mapped[BillingInterval | None] = mapped_column(
        Enum(BillingInterval),
        nullable=True
    )
    
    # Limits based on plan
    invoices_limit: Mapped[int] = mapped_column(Integer, default=25, nullable=False)
    invoices_used_this_month: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    extra_invoice_price: Mapped[str] = mapped_column(String(10), default="0.50", nullable=False)
    
    # Trial info
    trial_start: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    trial_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Billing dates
    current_period_start: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Cancellation
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    canceled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationship
    merchant = relationship("Merchant", back_populates="subscription")


# Plan configuration - used for setting limits
PLAN_CONFIG = {
    SubscriptionPlan.free_trial: {
        "invoices_limit": 25,
        "extra_invoice_price": "0.50",
        "price_monthly": 0,
        "price_yearly": 0,
    },
    SubscriptionPlan.starter: {
        "invoices_limit": 25,
        "extra_invoice_price": "0.50",
        "price_monthly": 15.00,
        "price_yearly": 150.00,
    },
    SubscriptionPlan.pro: {
        "invoices_limit": 500,
        "extra_invoice_price": "0.25",
        "price_monthly": 30.00,
        "price_yearly": 320.00,
    },
    SubscriptionPlan.enterprise: {
        "invoices_limit": 1000,
        "extra_invoice_price": "0.15",
        "price_monthly": 120.00,
        "price_yearly": 1400.00,
    },
}
