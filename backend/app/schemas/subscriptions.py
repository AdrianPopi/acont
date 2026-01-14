"""
Schemas for subscription management.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.subscription import SubscriptionPlan, SubscriptionStatus, BillingInterval


class SubscriptionOut(BaseModel):
    """Subscription information returned to frontend."""
    id: int
    plan: SubscriptionPlan
    status: SubscriptionStatus
    billing_interval: Optional[BillingInterval] = None
    
    invoices_limit: int
    invoices_used_this_month: int
    extra_invoice_price: str
    
    trial_start: Optional[datetime] = None
    trial_end: Optional[datetime] = None
    
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    
    cancel_at_period_end: bool = False
    
    class Config:
        from_attributes = True


class CreateCheckoutSessionRequest(BaseModel):
    """Request to create a Stripe checkout session."""
    plan: SubscriptionPlan
    billing_interval: BillingInterval
    success_url: str
    cancel_url: str


class CreateCheckoutSessionResponse(BaseModel):
    """Response with checkout session URL."""
    checkout_url: str
    session_id: str


class CreatePortalSessionRequest(BaseModel):
    """Request to create a Stripe customer portal session."""
    return_url: str


class CreatePortalSessionResponse(BaseModel):
    """Response with portal session URL."""
    portal_url: str


class PlanInfo(BaseModel):
    """Information about a subscription plan."""
    name: str
    plan: SubscriptionPlan
    invoices_limit: int
    extra_invoice_price: str
    price_monthly: float
    price_yearly: float
    features: list[str]


class PlansResponse(BaseModel):
    """All available plans."""
    plans: list[PlanInfo]
    current_plan: Optional[SubscriptionPlan] = None


class UsageResponse(BaseModel):
    """Current usage statistics."""
    invoices_used: int
    invoices_limit: int
    invoices_remaining: int
    extra_invoices_count: int
    extra_invoices_cost: float
    plan: SubscriptionPlan
    status: SubscriptionStatus
    days_until_reset: int
