"""
Reports endpoints for generating business analytics and reports.
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, and_, extract
from sqlalchemy.orm import Session

from app.api.routes.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.merchant import Merchant
from app.models.invoice import Invoice
from app.models.client import Client
from app.models.product import Product
from app.models.credit_note import CreditNote

router = APIRouter()


def _get_merchant_id(db: Session, user: User) -> int:
    """Get merchant_id for the current user."""
    from fastapi import HTTPException
    merchant = db.query(Merchant).filter(Merchant.owner_user_id == user.id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found for this user")
    return merchant.id


@router.get("/revenue")
async def get_revenue_report(
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    group_by: str = Query("month", regex="^(day|week|month|year)$"),
    current_user: User = Depends(require_role(UserRole.merchant_admin)),
    db: Session = Depends(get_db),
):
    """
    Get revenue report with grouping by day/week/month/year.
    Returns: total revenue, invoice count, average invoice value.
    """
    merchant_id = _get_merchant_id(db, current_user)

    query = db.query(
        func.sum(Invoice.total_gross).label("total_revenue"),
        func.count(Invoice.id).label("invoice_count"),
        func.avg(Invoice.total_gross).label("avg_invoice"),
    ).filter(Invoice.merchant_id == merchant_id)

    # Date filters
    if start_date:
        query = query.filter(Invoice.issue_date >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Invoice.issue_date <= datetime.fromisoformat(end_date))

    # Group by time period
    if group_by == "day":
        query = query.add_columns(
            func.date(Invoice.issue_date).label("period")
        ).group_by(func.date(Invoice.issue_date))
    elif group_by == "week":
        query = query.add_columns(
            extract("year", Invoice.issue_date).label("year"),
            extract("week", Invoice.issue_date).label("week"),
        ).group_by(
            extract("year", Invoice.issue_date),
            extract("week", Invoice.issue_date),
        )
    elif group_by == "month":
        query = query.add_columns(
            extract("year", Invoice.issue_date).label("year"),
            extract("month", Invoice.issue_date).label("month"),
        ).group_by(
            extract("year", Invoice.issue_date),
            extract("month", Invoice.issue_date),
        )
    elif group_by == "year":
        query = query.add_columns(
            extract("year", Invoice.issue_date).label("year")
        ).group_by(extract("year", Invoice.issue_date))

    results = query.all()

    data = []
    for row in results:
        item = {
            "total_revenue": float(row.total_revenue or 0),
            "invoice_count": row.invoice_count,
            "avg_invoice": float(row.avg_invoice or 0),
        }
        
        if group_by == "day":
            item["period"] = str(row.period)
        elif group_by == "week":
            item["year"] = row.year
            item["week"] = row.week
        elif group_by == "month":
            item["year"] = row.year
            item["month"] = row.month
        elif group_by == "year":
            item["year"] = row.year
            
        data.append(item)

    return {"group_by": group_by, "data": data}


@router.get("/invoices-summary")
async def get_invoices_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(require_role(UserRole.merchant_admin)),
    db: Session = Depends(get_db),
):
    """
    Get invoices summary: total, paid, pending, overdue.
    """
    merchant_id = _get_merchant_id(db, current_user)

    base_query = db.query(Invoice).filter(Invoice.merchant_id == merchant_id)

    if start_date:
        base_query = base_query.filter(Invoice.issue_date >= datetime.fromisoformat(start_date))
    if end_date:
        base_query = base_query.filter(Invoice.issue_date <= datetime.fromisoformat(end_date))

    total_count = base_query.count()
    total_amount = db.query(func.sum(Invoice.total_gross)).filter(
        Invoice.merchant_id == merchant_id
    ).scalar() or 0

    paid_count = base_query.filter(Invoice.status == "paid").count()
    paid_amount = db.query(func.sum(Invoice.total_gross)).filter(
        and_(Invoice.merchant_id == merchant_id, Invoice.status == "paid")
    ).scalar() or 0

    pending_count = base_query.filter(Invoice.status == "issued").count()
    pending_amount = db.query(func.sum(Invoice.total_gross)).filter(
        and_(Invoice.merchant_id == merchant_id, Invoice.status == "issued")
    ).scalar() or 0

    # Overdue: issued + due_date < today
    today = datetime.utcnow().date()
    overdue_count = base_query.filter(
        and_(Invoice.status == "issued", Invoice.due_date < today)
    ).count()
    overdue_amount = db.query(func.sum(Invoice.total_gross)).filter(
        and_(
            Invoice.merchant_id == merchant_id,
            Invoice.status == "issued",
            Invoice.due_date < today,
        )
    ).scalar() or 0

    return {
        "total": {"count": total_count, "amount": float(total_amount)},
        "paid": {"count": paid_count, "amount": float(paid_amount)},
        "pending": {"count": pending_count, "amount": float(pending_amount)},
        "overdue": {"count": overdue_count, "amount": float(overdue_amount)},
    }


@router.get("/clients-summary")
async def get_clients_summary(
    current_user: User = Depends(require_role(UserRole.merchant_admin)),
    db: Session = Depends(get_db),
):
    """
    Get clients summary: total clients, top clients by revenue.
    """
    merchant_id = _get_merchant_id(db, current_user)

    total_clients = db.query(Client).filter(Client.merchant_id == merchant_id).count()

    # Top 10 clients by revenue
    top_clients = (
        db.query(
            Client.id,
            Client.name,
            func.count(Invoice.id).label("invoice_count"),
            func.sum(Invoice.total_gross).label("total_revenue"),
        )
        .join(Invoice, Invoice.client_id == Client.id)
        .filter(Client.merchant_id == merchant_id)
        .group_by(Client.id, Client.name)
        .order_by(func.sum(Invoice.total_gross).desc())
        .limit(10)
        .all()
    )

    top_clients_data = [
        {
            "client_id": c.id,
            "client_name": c.name,
            "invoice_count": c.invoice_count,
            "total_revenue": float(c.total_revenue or 0),
        }
        for c in top_clients
    ]

    return {
        "total_clients": total_clients,
        "top_clients": top_clients_data,
    }


@router.get("/products-summary")
async def get_products_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(require_role(UserRole.merchant_admin)),
    db: Session = Depends(get_db),
):
    """
    Get products summary: most sold products, revenue by product.
    """
    merchant_id = _get_merchant_id(db, current_user)

    # Top products would require invoice_items join
    # For now, return basic product count
    total_products = db.query(Product).filter(Product.merchant_id == merchant_id).count()

    return {
        "total_products": total_products,
        "message": "Detailed product analytics require invoice items tracking",
    }


@router.get("/tax-summary")
async def get_tax_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: User = Depends(require_role(UserRole.merchant_admin)),
    db: Session = Depends(get_db),
):
    """
    Get tax summary: total VAT collected by period.
    """
    merchant_id = _get_merchant_id(db, current_user)

    query = db.query(
        func.sum(Invoice.vat_total).label("total_tax"),
        func.sum(Invoice.subtotal_net).label("total_subtotal"),
        func.sum(Invoice.total_gross).label("total_with_tax"),
    ).filter(Invoice.merchant_id == merchant_id)

    if start_date:
        query = query.filter(Invoice.issue_date >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Invoice.issue_date <= datetime.fromisoformat(end_date))

    result = query.first()

    return {
        "total_tax_collected": float(result.total_tax or 0),
        "total_subtotal": float(result.total_subtotal or 0),
        "total_with_tax": float(result.total_with_tax or 0),
    }


@router.get("/dashboard")
async def get_dashboard_summary(
    current_user: User = Depends(require_role(UserRole.merchant_admin)),
    db: Session = Depends(get_db),
):
    """
    Get comprehensive dashboard with all key metrics.
    """
    merchant_id = _get_merchant_id(db, current_user)

    # Last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    # Revenue last 30 days
    revenue_30d = (
        db.query(func.sum(Invoice.total_gross))
        .filter(
            and_(
                Invoice.merchant_id == merchant_id,
                Invoice.issue_date >= thirty_days_ago,
            )
        )
        .scalar() or 0
    )

    # Total invoices
    total_invoices = db.query(Invoice).filter(Invoice.merchant_id == merchant_id).count()

    # Total clients
    total_clients = db.query(Client).filter(Client.merchant_id == merchant_id).count()

    # Pending invoices (issued but not paid)
    pending_invoices = (
        db.query(Invoice)
        .filter(and_(Invoice.merchant_id == merchant_id, Invoice.status == "issued"))
        .count()
    )

    # Overdue invoices
    today = datetime.utcnow().date()
    overdue_invoices = (
        db.query(Invoice)
        .filter(
            and_(
                Invoice.merchant_id == merchant_id,
                Invoice.status == "issued",
                Invoice.due_date < today,
            )
        )
        .count()
    )

    return {
        "revenue_last_30_days": float(revenue_30d),
        "total_invoices": total_invoices,
        "total_clients": total_clients,
        "pending_invoices": pending_invoices,
        "overdue_invoices": overdue_invoices,
    }
