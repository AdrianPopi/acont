from __future__ import annotations

from datetime import datetime, timezone, date
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.routes.deps import get_current_user
from app.models.user import User, UserRole
from app.models.merchant import Merchant
from app.models.client import Client
from app.models.product import Product
from app.models.invoice import Invoice, InvoiceStatus
from app.models.invoice_item import InvoiceItem
from app.models.invoice_sequence import InvoiceSequence
from app.models.subscription import Subscription, SubscriptionStatus
from app.schemas.invoices import InvoiceCreateIn, InvoiceListOut, InvoiceOut
from app.core.invoice_pdf import build_invoice_pdf
from app.core.usage_tracking import check_and_increment_usage, get_usage_status, get_subscription_for_merchant, should_warn_user
from app.core.email import send_invoice_email

router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.get("/usage-check")
def check_invoice_usage(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Check current usage status before creating an invoice.
    Returns warning info if user is approaching or over their limit.
    """
    m = _current_merchant(db, user)
    subscription = get_subscription_for_merchant(db, m)
    
    if not subscription:
        return {
            "can_create": True,
            "warning": None,
        }
    
    usage_status = get_usage_status(subscription)
    should_warn, warn_level = should_warn_user(subscription)
    
    # Messages for different warning levels (will be translated on frontend)
    warning_messages = {
        "approaching": "You are approaching your monthly invoice limit. Additional invoices will be charged at €{extra_price}/invoice.",
        "at_limit": "You have reached your monthly invoice limit. Additional invoices will be charged at €{extra_price}/invoice.",
        "over_limit": "You have exceeded your monthly limit. {extra_count} extra invoices this month will be charged €{extra_cost:.2f} on your next bill.",
    }
    
    warning_message = None
    if should_warn and warn_level in warning_messages:
        warning_message = warning_messages[warn_level].format(
            extra_price=usage_status.extra_unit_price,
            extra_count=usage_status.extra_count,
            extra_cost=usage_status.extra_cost,
        )
    
    return {
        "can_create": True,  # We allow creation, just warn
        "warning_level": warn_level if should_warn else None,
        "warning_message": warning_message,
        "usage": usage_status.to_dict(),
        "plan": subscription.plan.value,
        "status": subscription.status.value,
    }


def normalize_lang(v: str | None) -> str:
    if not v:
        return "FR"
    v = v.strip().upper()
    return v if v in ("FR", "EN", "NL") else "FR"


def _current_merchant(db: Session, user: User) -> Merchant:
    if user.role != UserRole.merchant_admin:
        raise HTTPException(403, "Only merchants can access invoices")
    m = db.query(Merchant).filter(Merchant.owner_user_id == user.id).first()
    if not m:
        raise HTTPException(403, "Merchant not found for this user")
    return m


def _structured_reference_from_id(inv_id: int) -> str:
    # 10 digits + mod97 => +++xxx/xxxx/xxxxxmm+++
    raw10 = f"{inv_id:010d}"
    n = int(raw10)
    mod = n % 97
    if mod == 0:
        mod = 97
    return f"+++{raw10[:3]}/{raw10[3:7]}/{raw10[7:]}{mod:02d}+++"


def _compute_totals_and_breakdown_from_items(items: list[dict], discount_percent: float, advance_paid: float):
    disc = max(0.0, float(discount_percent or 0.0)) / 100.0

    subtotal_net_before = 0.0
    subtotal_net = 0.0
    vat_total = 0.0
    total_gross = 0.0

    breakdown: dict[str, dict[str, float]] = {}
    computed_items: list[tuple[float, float, float]] = []

    for it in items:
        qty = float(it.get("quantity") or 0)
        price = float(it.get("unit_price") or 0)
        rate = float(it.get("vat_rate") or 0)

        net_before = qty * price
        net = net_before * (1.0 - disc)
        vat = net * (rate / 100.0)
        gross = net + vat

        subtotal_net_before += net_before
        subtotal_net += net
        vat_total += vat
        total_gross += gross

        k = f"{rate:.2f}".rstrip("0").rstrip(".")
        if k not in breakdown:
            breakdown[k] = {"base": 0.0, "vat": 0.0}
        breakdown[k]["base"] += net
        breakdown[k]["vat"] += vat

        computed_items.append((net, vat, gross))

    discount_amount = subtotal_net_before - subtotal_net
    total_due = max(0.0, total_gross - float(advance_paid or 0.0))

    return subtotal_net, vat_total, total_gross, discount_amount, total_due, breakdown, computed_items


def _issue_number(db: Session, merchant_id: int, year: int) -> tuple[int, str]:
    # Row lock -> no duplicates
    seq = (
        db.query(InvoiceSequence)
        .filter(
            InvoiceSequence.merchant_id == merchant_id,
            InvoiceSequence.year == year,
            InvoiceSequence.doc_type == "invoice",
        )
        .with_for_update()
        .first()
    )
    if not seq:
        seq = InvoiceSequence(merchant_id=merchant_id, year=year, doc_type="invoice", next_number=1)
        db.add(seq)
        db.flush()

    n = int(seq.next_number)
    seq.next_number = n + 1

    # ✅ cerință: 000001, 000002...
    invoice_no = f"{n:06d}"
    return n, invoice_no


@router.get("/meta")
def invoices_meta(
    issue_date: date = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m = _current_merchant(db, user)

    last = (
        db.query(Invoice)
        .filter(Invoice.merchant_id == m.id, Invoice.status == InvoiceStatus.issued)
        .order_by(Invoice.issue_date.desc(), Invoice.id.desc())
        .first()
    )
    last_date = last.issue_date if last else None

    year = issue_date.year
    seq = (
        db.query(InvoiceSequence)
        .filter(
            InvoiceSequence.merchant_id == m.id,
            InvoiceSequence.year == year,
            InvoiceSequence.doc_type == "invoice",
        )
        .first()
    )
    next_n = int(seq.next_number) if seq else 1
    next_invoice_no = f"{next_n:06d}"

    return {"last_issued_date": last_date, "next_invoice_no": next_invoice_no}


@router.get("", response_model=list[InvoiceListOut])
def list_invoices(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = _current_merchant(db, user)

    rows = (
        db.query(Invoice)
        .filter(Invoice.merchant_id == m.id)
        .order_by(Invoice.issue_date.desc(), Invoice.id.desc())
        .limit(200)
        .all()
    )

    return [
        InvoiceListOut(
            id=r.id,
            invoice_no=r.invoice_no or "DRAFT",
            status=r.status.value,
            issue_date=r.issue_date,
            due_date=r.due_date,
            client_name=r.client_name,
            client_email=r.client_email or "",
            total_gross=float(r.total_gross),
            advance_paid=float(r.advance_paid),
            notes=(r.notes or ""),  # ✅ ADD
        )
        for r in rows
    ]


@router.post("", response_model=InvoiceOut)
def create_invoice(payload: InvoiceCreateIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = _current_merchant(db, user)

    # ✅ EUR only
    if (payload.currency or "EUR").upper() != "EUR":
        raise HTTPException(400, "Only EUR is supported")

    # ✅ date rules
    today = datetime.now(timezone.utc).date()
    if payload.issue_date > today:
        raise HTTPException(400, "Issue date cannot be in the future")

    # ✅ ordine cronologică (nu poți emite cu dată mai veche decât ultima emisă)
    last = (
        db.query(Invoice)
        .filter(Invoice.merchant_id == m.id, Invoice.status == InvoiceStatus.issued)
        .order_by(Invoice.issue_date.desc(), Invoice.id.desc())
        .first()
    )
    if last and payload.issue_date < last.issue_date:
        raise HTTPException(
            400,
            f"Issue date cannot be before last issued invoice date ({last.issue_date.isoformat()})",
        )

    if payload.due_date and payload.due_date < payload.issue_date:
        raise HTTPException(400, "Due date cannot be before issue date")

    language = normalize_lang(payload.language)

    # ✅ client select -> autofill
    client_name = (payload.client_name or "").strip()
    client_email = (payload.client_email or "").strip()
    client_tax_id = (payload.client_tax_id or "").strip()
    client_address = (payload.client_address or "").strip()
    client_peppol_id = ""  # Initialize PEPPOL ID

    client_id = getattr(payload, "client_id", None)
    if client_id:
        c = db.query(Client).filter(Client.id == client_id, Client.merchant_id == m.id).first()
        if not c:
            raise HTTPException(404, "Client not found")
        if not client_name:
            client_name = c.name or ""
        if not client_email:
            client_email = c.email or ""
        if not client_tax_id:
            client_tax_id = c.tax_id or ""
        if not client_address:
            client_address = c.address or ""
        # Load PEPPOL ID from client
        client_peppol_id = (c.peppol_id or "").strip()
    
    # Determine transmission method based on PEPPOL availability
    transmission_method = "peppol" if client_peppol_id else "email"

    # ✅ item dropdown product_id -> autofill (doar dacă lipsesc în payload)
    normalized_items: list[dict] = []
    for it in (payload.items or []):
        product_id = getattr(it, "product_id", None)

        item_code = (getattr(it, "item_code", None) or "").strip()
        desc = (getattr(it, "description", None) or "").strip()
        qty = float(getattr(it, "quantity", 0) or 0)

        unit_price_in = getattr(it, "unit_price", None)
        vat_rate_in = getattr(it, "vat_rate", None)

        unit_price = float(unit_price_in) if unit_price_in is not None else None
        vat_rate = float(vat_rate_in) if vat_rate_in is not None else None

        if product_id:
            p = db.query(Product).filter(Product.id == product_id, Product.merchant_id == m.id).first()
            if not p:
                raise HTTPException(404, "Product not found")

            if not item_code:
                item_code = (getattr(p, "code", "") or "").strip()
            if not desc:
                desc = (getattr(p, "name", "") or "").strip()
            if unit_price is None:
                unit_price = float(getattr(p, "unit_price", 0) or 0)
            if vat_rate is None:
                vat_rate = float(getattr(p, "vat_rate", 0) or 0)

        normalized_items.append(
            {
                "item_code": item_code,
                "description": desc,
                "unit_price": float(unit_price or 0.0),
                "quantity": qty,
                "vat_rate": float(vat_rate or 0.0),
            }
        )

    subtotal_net, vat_total, total_gross, discount_amount, total_due, breakdown, computed_items = (
        _compute_totals_and_breakdown_from_items(
            normalized_items,
            discount_percent=float(payload.discount_percent or 0.0),
            advance_paid=float(payload.advance_paid or 0.0),
        )
    )

    comm_mode = (getattr(payload, "communication_mode", None) or "simple").strip().lower()
    if comm_mode not in ("simple", "structured"):
        comm_mode = "simple"
    comm_ref = (getattr(payload, "communication_reference", None) or "").strip()

    inv = Invoice(
        merchant_id=m.id,
        client_id=client_id,

        status=InvoiceStatus.draft,
        series="INV",
        year=payload.issue_date.year,
        number=None,
        invoice_no="",

        issue_date=payload.issue_date,
        due_date=payload.due_date,

        language=language,
        currency="EUR",

        communication_mode=comm_mode,
        communication_reference="",
        template=(getattr(payload, "template", None) or "classic"),

        client_name=client_name[:256],
        client_email=client_email[:256],
        client_tax_id=client_tax_id[:64],
        client_address=client_address[:512],
        client_peppol_id=client_peppol_id[:100],
        
        transmission_method=transmission_method,
        sent_via_email=False,
        sent_via_peppol=False,

        discount_percent=float(payload.discount_percent or 0),
        advance_paid=float(payload.advance_paid or 0),

        subtotal_net=subtotal_net,
        vat_total=vat_total,
        total_gross=total_gross,

        notes=(payload.notes or "")[:1024],
    )
    db.add(inv)
    db.flush()

    # ✅ structured reference auto-generate if missing
    if comm_mode == "structured":
        if not comm_ref:
            comm_ref = _structured_reference_from_id(inv.id)
        inv.communication_reference = comm_ref
    else:
        inv.communication_reference = ""

    # items (folosim normalized_items, nu umblăm la payload)
    for idx, it in enumerate(normalized_items):
        net, vat, gross = computed_items[idx]
        db.add(
            InvoiceItem(
                invoice_id=inv.id,
                item_code=(it.get("item_code") or "")[:64],
                description=(it.get("description") or "")[:512],
                unit_price=float(it.get("unit_price") or 0),
                quantity=float(it.get("quantity") or 0),
                vat_rate=float(it.get("vat_rate") or 0),
                line_net=net,
                line_vat=vat,
                line_gross=gross,
            )
        )

    if payload.issue_now:
        n, inv_no = _issue_number(db, m.id, inv.year)
        inv.number = n
        inv.invoice_no = inv_no
        inv.status = InvoiceStatus.issued
        inv.issued_at = datetime.now(timezone.utc)
        
        # ✅ Track usage when invoice is issued
        subscription = get_subscription_for_merchant(db, m)
        if subscription:
            is_over_limit, usage_warning = check_and_increment_usage(db, subscription, document_count=1)

    db.commit()
    db.refresh(inv)
    
    # ✅ Return usage warning in response if applicable
    usage_info = None
    if payload.issue_now:
        subscription = get_subscription_for_merchant(db, m)
        if subscription:
            should_warn, warn_level = should_warn_user(subscription)
            if should_warn:
                usage_status = get_usage_status(subscription)
                usage_info = {
                    "warning_level": warn_level,
                    **usage_status.to_dict()
                }

    return InvoiceOut(
        id=inv.id,
        invoice_no=inv.invoice_no or "DRAFT",
        status=inv.status.value,
        issue_date=inv.issue_date,
        due_date=inv.due_date,
        client_name=inv.client_name,
        total_gross=float(inv.total_gross),
        advance_paid=float(inv.advance_paid),

        currency=inv.currency,
        language=inv.language,
        subtotal_net=float(inv.subtotal_net),
        vat_total=float(inv.vat_total),
        notes=inv.notes,

        discount_percent=float(inv.discount_percent),
        discount_amount=float(discount_amount),
        total_due=float(total_due),

        vat_breakdown={k: {"base": float(v["base"]), "vat": float(v["vat"])} for k, v in breakdown.items()},

        communication_mode=getattr(inv, "communication_mode", "simple"),
        communication_reference=getattr(inv, "communication_reference", "") or "",
        template=getattr(inv, "template", "classic"),
        client_id=getattr(inv, "client_id", None),
    )


@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = _current_merchant(db, user)
    inv = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.merchant_id == m.id).first()
    if not inv:
        raise HTTPException(404, "Invoice not found")

    items = db.query(InvoiceItem).filter(InvoiceItem.invoice_id == inv.id).all()

    breakdown: dict[str, dict[str, float]] = {}
    for it in items:
        rate = float(getattr(it, "vat_rate", 0.0) or 0.0)
        k = f"{rate:.2f}".rstrip("0").rstrip(".")
        if k not in breakdown:
            breakdown[k] = {"base": 0.0, "vat": 0.0}
        breakdown[k]["base"] += float(getattr(it, "line_net", 0.0) or 0.0)
        breakdown[k]["vat"] += float(getattr(it, "line_vat", 0.0) or 0.0)

    disc = max(0.0, float(getattr(inv, "discount_percent", 0.0) or 0.0)) / 100.0
    subtotal_net = float(getattr(inv, "subtotal_net", 0.0) or 0.0)

    if disc > 0.0 and disc < 1.0:
        subtotal_net_before = sum(float(getattr(it, "line_net", 0.0) or 0.0) / (1.0 - disc) for it in items)
    else:
        subtotal_net_before = subtotal_net

    discount_amount = max(0.0, subtotal_net_before - subtotal_net)

    total_gross = float(getattr(inv, "total_gross", 0.0) or 0.0)
    advance_paid = float(getattr(inv, "advance_paid", 0.0) or 0.0)
    total_due = max(0.0, total_gross - advance_paid)

    return InvoiceOut(
        id=inv.id,
        invoice_no=inv.invoice_no or "DRAFT",
        status=inv.status.value,
        issue_date=inv.issue_date,
        due_date=inv.due_date,
        client_name=inv.client_name,
        total_gross=total_gross,
        advance_paid=advance_paid,
   

        currency=inv.currency,
        language=inv.language,
        subtotal_net=subtotal_net,
        vat_total=float(getattr(inv, "vat_total", 0.0) or 0.0),
        notes=inv.notes,
         items=[
        {
            "item_code": it.item_code,
            "description": it.description,
            "unit_price": float(it.unit_price),
            "quantity": float(it.quantity),
            "vat_rate": float(it.vat_rate),
            "line_net": float(it.line_net),
            "line_vat": float(it.line_vat),
            "line_gross": float(it.line_gross),
        }
        for it in inv.items
    ],

        discount_percent=float(getattr(inv, "discount_percent", 0.0) or 0.0),
        discount_amount=float(discount_amount),
        total_due=float(total_due),

        vat_breakdown={k: {"base": float(v["base"]), "vat": float(v["vat"])} for k, v in breakdown.items()},

        communication_mode=getattr(inv, "communication_mode", "simple"),
        communication_reference=getattr(inv, "communication_reference", "") or "",
        template=getattr(inv, "template", "classic"),
        client_id=getattr(inv, "client_id", None),
    )
   

@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(invoice_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = _current_merchant(db, user)
    inv = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.merchant_id == m.id).first()
    if not inv:
        raise HTTPException(404, "Invoice not found")

    pdf = build_invoice_pdf(inv, merchant_logo_url=m.logo_url)
    filename = (inv.invoice_no or f"invoice-{inv.id}").replace("/", "-") + ".pdf"

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


from pydantic import BaseModel, EmailStr

class SendEmailRequest(BaseModel):
    from_email: EmailStr
    to_email: EmailStr


@router.post("/{invoice_id}/send-email")
def send_invoice_email_endpoint(
    invoice_id: int,
    req: SendEmailRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send invoice PDF via email.
    Uses SMTP service if configured, otherwise logs to console.
    """
    m = _current_merchant(db, user)
    inv = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.merchant_id == m.id).first()
    if not inv:
        raise HTTPException(404, "Invoice not found")

    # Validate that the from_email belongs to this merchant
    valid_emails = [
        m.communication_email,
        m.client_invoices_email,
        m.supplier_invoices_email,
    ]
    valid_emails = [e for e in valid_emails if e]  # filter empty
    
    if req.from_email not in valid_emails:
        raise HTTPException(400, "Invalid sender email. Please configure your email in Settings.")

    # Generate PDF
    pdf = build_invoice_pdf(inv, merchant_logo_url=m.logo_url)
    filename = (inv.invoice_no or f"invoice-{inv.id}").replace("/", "-") + ".pdf"
    
    # Prepare invoice details
    issue_date_str = inv.issue_date.strftime("%d/%m/%Y") if inv.issue_date else ""
    due_date_str = inv.due_date.strftime("%d/%m/%Y") if inv.due_date else ""
    total_amount_str = f"{float(inv.total_gross):.2f}"
    payment_ref = inv.communication_reference or inv.invoice_no or ""
    
    # Determine language
    language = (inv.language or "FR").lower()[:2]
    
    # Send email using email service
    email_sent = send_invoice_email(
        to_email=req.to_email,
        client_name=inv.client_name,
        company_name=m.company_name,
        invoice_no=inv.invoice_no,
        issue_date=issue_date_str,
        due_date=due_date_str,
        total_amount=total_amount_str,
        payment_reference=payment_ref,
        language=language,
        from_email=req.from_email,
        pdf_attachment=pdf,
    )
    
    # Mark invoice as sent via email
    inv.sent_via_email = True
    db.commit()
    
    return {
        "success": True,
        "email_sent": email_sent,
        "message": f"Invoice {inv.invoice_no} {'sent' if email_sent else 'queued'} to {req.to_email}",
        "from_email": req.from_email,
        "to_email": req.to_email,
        "invoice_no": inv.invoice_no,
    }

