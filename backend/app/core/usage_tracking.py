"""
Subscription usage tracking helpers.
Provides functions for monitoring and incrementing document usage.
"""
from datetime import datetime
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from app.models.subscription import Subscription, SubscriptionStatus, SubscriptionPlan
from app.models.merchant import Merchant


class UsageLimitExceeded(Exception):
    """Raised when user exceeds their plan limit (for blocking if needed)."""
    pass


class UsageWarning:
    """Warning about approaching or exceeding usage limits."""
    def __init__(
        self,
        at_limit: bool,
        over_limit: bool,
        extra_count: int,
        extra_cost: float,
        limit: int,
        used: int,
        remaining: int,
        plan: str,
        extra_unit_price: float,
    ):
        self.at_limit = at_limit  # Exactly at 100%
        self.over_limit = over_limit  # Over 100%
        self.extra_count = extra_count  # Documents over limit
        self.extra_cost = extra_cost  # Total extra cost so far
        self.limit = limit
        self.used = used
        self.remaining = remaining
        self.plan = plan
        self.extra_unit_price = extra_unit_price
    
    def to_dict(self) -> dict:
        return {
            "at_limit": self.at_limit,
            "over_limit": self.over_limit,
            "extra_count": self.extra_count,
            "extra_cost": self.extra_cost,
            "limit": self.limit,
            "used": self.used,
            "remaining": self.remaining,
            "plan": self.plan,
            "extra_unit_price": self.extra_unit_price,
        }


def get_usage_status(subscription: Subscription) -> UsageWarning:
    """
    Get the current usage status without modifying anything.
    """
    used = subscription.invoices_used_this_month
    limit = subscription.invoices_limit
    remaining = max(0, limit - used)
    extra_count = max(0, used - limit)
    extra_unit_price = float(subscription.extra_invoice_price)
    extra_cost = extra_count * extra_unit_price
    
    return UsageWarning(
        at_limit=(used == limit),
        over_limit=(used > limit),
        extra_count=extra_count,
        extra_cost=extra_cost,
        limit=limit,
        used=used,
        remaining=remaining,
        plan=subscription.plan.value,
        extra_unit_price=extra_unit_price,
    )


def check_and_increment_usage(
    db: Session,
    subscription: Subscription,
    document_count: int = 1,
) -> Tuple[bool, UsageWarning]:
    """
    Check usage limits and increment counter.
    
    Returns:
        Tuple of (is_over_limit, UsageWarning)
        
    Note: We don't block creation, we just track and warn.
    Extra documents will be charged on monthly invoice.
    """
    # Verify subscription is active or trialing
    if subscription.status not in [SubscriptionStatus.active, SubscriptionStatus.trialing]:
        # Could raise exception here if needed
        pass
    
    # Get current status before increment
    was_at_limit = subscription.invoices_used_this_month >= subscription.invoices_limit
    
    # Increment usage
    subscription.invoices_used_this_month += document_count
    db.commit()
    
    # Get new status after increment
    warning = get_usage_status(subscription)
    
    return warning.over_limit, warning


def get_subscription_for_merchant(db: Session, merchant: Merchant) -> Optional[Subscription]:
    """
    Get subscription for a merchant, creating free trial if needed.
    """
    from datetime import timedelta
    
    if merchant.subscription:
        return merchant.subscription
    
    # Create free trial
    now = datetime.utcnow()
    sub = Subscription(
        merchant_id=merchant.id,
        plan=SubscriptionPlan.free_trial,
        status=SubscriptionStatus.trialing,
        invoices_limit=25,
        extra_invoice_price="0.50",
        trial_start=now,
        trial_end=now + timedelta(days=30),
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


def reset_monthly_usage(db: Session, subscription: Subscription) -> None:
    """
    Reset monthly usage counter. Called on successful payment.
    """
    subscription.invoices_used_this_month = 0
    db.commit()


def get_extra_documents_for_billing(subscription: Subscription) -> dict:
    """
    Get extra document info for billing.
    Returns dict with count and cost.
    """
    extra_count = max(0, subscription.invoices_used_this_month - subscription.invoices_limit)
    extra_unit_price = float(subscription.extra_invoice_price)
    extra_cost = extra_count * extra_unit_price
    
    return {
        "extra_count": extra_count,
        "extra_unit_price": extra_unit_price,
        "extra_cost": extra_cost,
        "description": f"{extra_count} additional documents @ €{extra_unit_price:.2f}",
    }


# Warning thresholds
WARNING_THRESHOLD_PERCENT = 80  # Warn when 80% used
CRITICAL_THRESHOLD_PERCENT = 100  # Critical when at limit


def should_warn_user(subscription: Subscription) -> Tuple[bool, str]:
    """
    Check if user should receive a warning about usage.
    
    Returns:
        Tuple of (should_warn, warning_level)
        warning_level: "none", "approaching", "at_limit", "over_limit"
    """
    used = subscription.invoices_used_this_month
    limit = subscription.invoices_limit
    
    if limit == 0:
        return False, "none"
    
    percent = (used / limit) * 100
    
    if percent >= 100 and used > limit:
        return True, "over_limit"
    elif percent >= 100:
        return True, "at_limit"
    elif percent >= WARNING_THRESHOLD_PERCENT:
        return True, "approaching"
    
    return False, "none"
