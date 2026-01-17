"""
Stripe subscription API routes.
"""
import stripe
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session

from app.api.routes.deps import get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.merchant import Merchant
from app.models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus, BillingInterval, PLAN_CONFIG
from app.schemas.subscriptions import (
    SubscriptionOut, CreateCheckoutSessionRequest, CreateCheckoutSessionResponse,
    CreatePortalSessionRequest, CreatePortalSessionResponse,
    PlanInfo, PlansResponse, UsageResponse
)
from app.core.config import settings

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# Price ID mapping
PRICE_ID_MAP = {
    (SubscriptionPlan.starter, BillingInterval.monthly): settings.STRIPE_PRICE_STARTER_MONTHLY,
    (SubscriptionPlan.starter, BillingInterval.yearly): settings.STRIPE_PRICE_STARTER_YEARLY,
    (SubscriptionPlan.pro, BillingInterval.monthly): settings.STRIPE_PRICE_PRO_MONTHLY,
    (SubscriptionPlan.pro, BillingInterval.yearly): settings.STRIPE_PRICE_PRO_YEARLY,
    (SubscriptionPlan.enterprise, BillingInterval.monthly): settings.STRIPE_PRICE_ENTERPRISE_MONTHLY,
    (SubscriptionPlan.enterprise, BillingInterval.yearly): settings.STRIPE_PRICE_ENTERPRISE_YEARLY,
}


def _current_merchant(db: Session, user: User) -> Merchant:
    """Get the merchant for the current user."""
    if user.role != UserRole.merchant_admin:
        raise HTTPException(403, "Only merchants can access subscriptions")
    m = db.query(Merchant).filter(Merchant.owner_user_id == user.id).first()
    if not m:
        raise HTTPException(403, "Merchant not found for this user")
    return m


def _get_or_create_subscription(db: Session, merchant: Merchant) -> Subscription:
    """Get or create subscription for merchant."""
    if merchant.subscription:
        return merchant.subscription
    
    # Create free trial subscription
    now = datetime.utcnow()
    sub = Subscription(
        merchant_id=merchant.id,
        plan=SubscriptionPlan.free_trial,
        status=SubscriptionStatus.trialing,
        invoices_limit=25,
        extra_invoice_price="0.50",
        trial_start=now,
        trial_end=now + timedelta(days=30),  # 1 month free trial
        current_period_start=now,
        current_period_end=now + timedelta(days=30),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.get("/current", response_model=SubscriptionOut)
def get_current_subscription(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current subscription for the merchant."""
    merchant = _current_merchant(db, user)
    sub = _get_or_create_subscription(db, merchant)
    return sub


@router.post("/sync")
def sync_subscription(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Sync subscription data from Stripe (useful for local testing)."""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(500, "Stripe not configured")
    
    merchant = _current_merchant(db, user)
    sub = _get_or_create_subscription(db, merchant)
    
    # If we have a Stripe subscription ID, sync from Stripe
    if sub.stripe_subscription_id:
        try:
            stripe_sub = stripe.Subscription.retrieve(sub.stripe_subscription_id)
            _update_subscription_from_stripe(sub, stripe_sub)
            db.commit()
        except stripe.error.StripeError as e:
            raise HTTPException(400, f"Failed to sync subscription: {str(e)}")
    
    return {"ok": True, "message": "Subscription synced"}


@router.get("/plans", response_model=PlansResponse)
def get_available_plans(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all available subscription plans."""
    merchant = _current_merchant(db, user)
    sub = _get_or_create_subscription(db, merchant)
    
    plans = [
        PlanInfo(
            name="Starter",
            plan=SubscriptionPlan.starter,
            invoices_limit=25,
            extra_invoice_price="0.50",
            price_monthly=15.00,
            price_yearly=150.00,
            features=[
                "25 documents/month (purchase & sales)",
                "Extra document: €0.50",
                "PDF + structured format export",
                "Email support",
                "Peppol integration",
            ]
        ),
        PlanInfo(
            name="Pro",
            plan=SubscriptionPlan.pro,
            invoices_limit=500,
            extra_invoice_price="0.25",
            price_monthly=30.00,
            price_yearly=320.00,
            features=[
                "500 documents/month (purchase & sales)",
                "Extra document: €0.25",
                "PDF + structured format export",
                "Email support",
                "Peppol integration",
            ]
        ),
        PlanInfo(
            name="Enterprise",
            plan=SubscriptionPlan.enterprise,
            invoices_limit=1000,
            extra_invoice_price="0.15",
            price_monthly=120.00,
            price_yearly=1400.00,
            features=[
                "1000 documents/month (purchase & sales)",
                "Extra document: €0.15",
                "PDF + structured format export",
                "Email support",
                "Peppol integration",
            ]
        ),
    ]
    
    return PlansResponse(plans=plans, current_plan=sub.plan)


@router.get("/usage", response_model=UsageResponse)
def get_usage(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current usage statistics."""
    merchant = _current_merchant(db, user)
    sub = _get_or_create_subscription(db, merchant)
    
    invoices_remaining = max(0, sub.invoices_limit - sub.invoices_used_this_month)
    extra_invoices = max(0, sub.invoices_used_this_month - sub.invoices_limit)
    extra_cost = extra_invoices * float(sub.extra_invoice_price)
    
    # Calculate days until reset
    days_until_reset = 0
    if sub.current_period_end:
        delta = sub.current_period_end - datetime.utcnow()
        days_until_reset = max(0, delta.days)
    
    return UsageResponse(
        invoices_used=sub.invoices_used_this_month,
        invoices_limit=sub.invoices_limit,
        invoices_remaining=invoices_remaining,
        extra_invoices_count=extra_invoices,
        extra_invoices_cost=extra_cost,
        plan=sub.plan,
        status=sub.status,
        days_until_reset=days_until_reset,
    )


@router.post("/checkout", response_model=CreateCheckoutSessionResponse)
def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe checkout session for subscription."""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(500, "Stripe not configured")
    
    merchant = _current_merchant(db, user)
    sub = _get_or_create_subscription(db, merchant)
    
    # Get price ID
    price_id = PRICE_ID_MAP.get((request.plan, request.billing_interval))
    if not price_id:
        raise HTTPException(400, "Invalid plan or billing interval")
    
    try:
        # Create or get Stripe customer
        if not sub.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                metadata={
                    "merchant_id": str(merchant.id),
                    "user_id": str(user.id),
                }
            )
            sub.stripe_customer_id = customer.id
            db.commit()
        
        # Create checkout session
        session = stripe.checkout.Session.create(
            customer=sub.stripe_customer_id,
            payment_method_types=["card"],
            line_items=[{
                "price": price_id,
                "quantity": 1,
            }],
            mode="subscription",
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            subscription_data={
                "metadata": {
                    "merchant_id": str(merchant.id),
                }
            },
            allow_promotion_codes=True,
        )
        
        return CreateCheckoutSessionResponse(
            checkout_url=session.url,
            session_id=session.id,
        )
        
    except stripe.error.StripeError as e:
        raise HTTPException(400, str(e))


@router.post("/portal", response_model=CreatePortalSessionResponse)
def create_portal_session(
    request: CreatePortalSessionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe customer portal session."""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(500, "Stripe not configured")
    
    merchant = _current_merchant(db, user)
    sub = _get_or_create_subscription(db, merchant)
    
    if not sub.stripe_customer_id:
        raise HTTPException(400, "No active subscription found")
    
    try:
        session = stripe.billing_portal.Session.create(
            customer=sub.stripe_customer_id,
            return_url=request.return_url,
        )
        
        return CreatePortalSessionResponse(portal_url=session.url)
        
    except stripe.error.StripeError as e:
        raise HTTPException(400, str(e))


@router.post("/cancel")
def cancel_subscription(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel the current subscription at period end."""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(500, "Stripe not configured")
    
    merchant = _current_merchant(db, user)
    sub = _get_or_create_subscription(db, merchant)
    
    if not sub.stripe_subscription_id:
        raise HTTPException(400, "No active Stripe subscription found")
    
    if sub.status == SubscriptionStatus.canceled:
        raise HTTPException(400, "Subscription is already canceled")
    
    try:
        # Cancel at period end (not immediately)
        stripe_sub = stripe.Subscription.modify(
            sub.stripe_subscription_id,
            cancel_at_period_end=True,
        )
        
        # Update local subscription
        sub.cancel_at_period_end = True
        db.commit()
        
        return {"ok": True, "message": "Subscription will be canceled at the end of the current period"}
        
    except stripe.error.StripeError as e:
        raise HTTPException(400, str(e))


@router.post("/reactivate")
def reactivate_subscription(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Reactivate a subscription that was set to cancel at period end."""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(500, "Stripe not configured")
    
    merchant = _current_merchant(db, user)
    sub = _get_or_create_subscription(db, merchant)
    
    if not sub.stripe_subscription_id:
        raise HTTPException(400, "No active Stripe subscription found")
    
    if not sub.cancel_at_period_end:
        raise HTTPException(400, "Subscription is not set to cancel")
    
    try:
        # Remove cancel at period end
        stripe_sub = stripe.Subscription.modify(
            sub.stripe_subscription_id,
            cancel_at_period_end=False,
        )
        
        # Update local subscription
        sub.cancel_at_period_end = False
        db.commit()
        
        return {"ok": True, "message": "Subscription reactivated successfully"}
        
    except stripe.error.StripeError as e:
        raise HTTPException(400, str(e))


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """Handle Stripe webhooks."""
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(500, "Webhook secret not configured")
    
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(400, "Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(400, "Invalid signature")
    
    # Handle different event types
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        await _handle_checkout_completed(db, session)
        
    elif event["type"] == "customer.subscription.updated":
        subscription = event["data"]["object"]
        await _handle_subscription_updated(db, subscription)
        
    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        await _handle_subscription_deleted(db, subscription)
        
    elif event["type"] == "invoice.payment_succeeded":
        invoice = event["data"]["object"]
        await _handle_payment_succeeded(db, invoice)
        
    elif event["type"] == "invoice.payment_failed":
        invoice = event["data"]["object"]
        await _handle_payment_failed(db, invoice)
    
    return {"status": "success"}


async def _handle_checkout_completed(db: Session, session: dict):
    """Handle successful checkout."""
    subscription_id = session.get("subscription")
    customer_id = session.get("customer")
    
    if not subscription_id or not customer_id:
        return
    
    # Get subscription details from Stripe
    stripe_sub = stripe.Subscription.retrieve(subscription_id)
    
    # Find our subscription by customer ID
    sub = db.query(Subscription).filter(
        Subscription.stripe_customer_id == customer_id
    ).first()
    
    if not sub:
        return
    
    # Update subscription
    _update_subscription_from_stripe(sub, stripe_sub)
    db.commit()


async def _handle_subscription_updated(db: Session, stripe_sub: dict):
    """Handle subscription update."""
    sub = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == stripe_sub["id"]
    ).first()
    
    if not sub:
        # Try finding by customer
        sub = db.query(Subscription).filter(
            Subscription.stripe_customer_id == stripe_sub["customer"]
        ).first()
    
    if sub:
        _update_subscription_from_stripe(sub, stripe_sub)
        db.commit()


async def _handle_subscription_deleted(db: Session, stripe_sub: dict):
    """Handle subscription cancellation."""
    sub = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == stripe_sub["id"]
    ).first()
    
    if sub:
        sub.status = SubscriptionStatus.canceled
        sub.canceled_at = datetime.utcnow()
        db.commit()


async def _handle_payment_succeeded(db: Session, invoice: dict):
    """Handle successful payment - reset usage counter."""
    customer_id = invoice.get("customer")
    
    sub = db.query(Subscription).filter(
        Subscription.stripe_customer_id == customer_id
    ).first()
    
    if sub:
        # Reset monthly usage on successful payment
        sub.invoices_used_this_month = 0
        db.commit()


async def _handle_payment_failed(db: Session, invoice: dict):
    """Handle failed payment."""
    customer_id = invoice.get("customer")
    
    sub = db.query(Subscription).filter(
        Subscription.stripe_customer_id == customer_id
    ).first()
    
    if sub:
        sub.status = SubscriptionStatus.past_due
        db.commit()


def _update_subscription_from_stripe(sub: Subscription, stripe_sub: dict):
    """Update local subscription from Stripe data."""
    sub.stripe_subscription_id = stripe_sub["id"]
    sub.stripe_price_id = stripe_sub["items"]["data"][0]["price"]["id"] if stripe_sub["items"]["data"] else None
    
    # Map Stripe status to our status
    status_map = {
        "trialing": SubscriptionStatus.trialing,
        "active": SubscriptionStatus.active,
        "past_due": SubscriptionStatus.past_due,
        "canceled": SubscriptionStatus.canceled,
        "unpaid": SubscriptionStatus.unpaid,
        "incomplete": SubscriptionStatus.incomplete,
        "incomplete_expired": SubscriptionStatus.incomplete_expired,
    }
    sub.status = status_map.get(stripe_sub["status"], SubscriptionStatus.active)
    
    # Determine plan from price ID
    price_id = sub.stripe_price_id
    if price_id:
        if price_id in [settings.STRIPE_PRICE_STARTER_MONTHLY, settings.STRIPE_PRICE_STARTER_YEARLY]:
            sub.plan = SubscriptionPlan.starter
            sub.invoices_limit = 25
            sub.extra_invoice_price = "0.50"
            sub.billing_interval = BillingInterval.yearly if price_id == settings.STRIPE_PRICE_STARTER_YEARLY else BillingInterval.monthly
        elif price_id in [settings.STRIPE_PRICE_PRO_MONTHLY, settings.STRIPE_PRICE_PRO_YEARLY]:
            sub.plan = SubscriptionPlan.pro
            sub.invoices_limit = 500
            sub.extra_invoice_price = "0.25"
            sub.billing_interval = BillingInterval.yearly if price_id == settings.STRIPE_PRICE_PRO_YEARLY else BillingInterval.monthly
        elif price_id in [settings.STRIPE_PRICE_ENTERPRISE_MONTHLY, settings.STRIPE_PRICE_ENTERPRISE_YEARLY]:
            sub.plan = SubscriptionPlan.enterprise
            sub.invoices_limit = 1000
            sub.extra_invoice_price = "0.15"
            sub.billing_interval = BillingInterval.yearly if price_id == settings.STRIPE_PRICE_ENTERPRISE_YEARLY else BillingInterval.monthly
    
    # Update period dates
    if stripe_sub.get("current_period_start"):
        sub.current_period_start = datetime.fromtimestamp(stripe_sub["current_period_start"])
    if stripe_sub.get("current_period_end"):
        sub.current_period_end = datetime.fromtimestamp(stripe_sub["current_period_end"])
    
    # Trial dates
    if stripe_sub.get("trial_start"):
        sub.trial_start = datetime.fromtimestamp(stripe_sub["trial_start"])
    if stripe_sub.get("trial_end"):
        sub.trial_end = datetime.fromtimestamp(stripe_sub["trial_end"])
    
    sub.cancel_at_period_end = stripe_sub.get("cancel_at_period_end", False)
