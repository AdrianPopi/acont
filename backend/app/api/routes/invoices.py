from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.routes.deps import get_current_user
from app.models.user import User, UserRole
from app.models.merchant import Merchant
from app.models.invoice import Invoice, InvoiceStatus
from app.models.invoice_item import InvoiceItem
from app.models.invoice_sequence import InvoiceSequence
from app.schemas.invoices import InvoiceCreateIn, InvoiceListOut, InvoiceOut
from app.core.invoice_pdf import build_invoice_pdf

router = APIRouter(prefix="/invoices", tags=["invoices"])

def normalize_lang(v: str | None) -> str:
    if not v:
        return "FR"  # default 
    v = v.strip().upper()
    if v in ("RO", "FR", "EN", "NL"):
        return v
    # accepts lowercase legacy
    if v.lower() in ("ro", "fr", "en", "nl"):
        return v.lower().upper()
    return "FR"


def _current_merchant(db: Session, user: User) -> Merchant:
    if user.role != UserRole.merchant_admin:
        raise HTTPException(403, "Only merchants can access invoices")
    m = db.query(Merchant).filter(Merchant.owner_user_id == user.id).first()
    if not m:
        raise HTTPException(403, "Merchant not found for this user")
    return m


def _compute_totals(payload: InvoiceCreateIn):
    # discount applied as factor to net+vat per line (simple MVP)
    disc = max(0.0, float(payload.discount_percent or 0.0)) / 100.0
    subtotal_net = 0.0
    vat_total = 0.0
    total_gross = 0.0

    computed_items = []
    for it in payload.items:
        qty = float(it.quantity or 0)
        price = float(it.unit_price or 0)
        vat_rate = float(it.vat_rate or 0) / 100.0

        net = qty * price
        net = net * (1.0 - disc)
        vat = net * vat_rate
        gross = net + vat

        subtotal_net += net
        vat_total += vat
        total_gross += gross

        computed_items.append((net, vat, gross))

    return subtotal_net, vat_total, total_gross, computed_items


def _issue_number(db: Session, merchant_id: int, year: int) -> tuple[int, str]:
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

    invoice_no = f"INV-{year}-{n:06d}"
    return n, invoice_no


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
            total_gross=float(r.total_gross),
            advance_paid=float(r.advance_paid),
        )
        for r in rows
    ]


@router.post("", response_model=InvoiceOut)
def create_invoice(payload: InvoiceCreateIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = _current_merchant(db, user)

    # date rules (safe)
    today = datetime.now(timezone.utc).date()
    if payload.issue_date > today:
        raise HTTPException(400, "Issue date cannot be in the future")
    if payload.due_date and payload.due_date < payload.issue_date:
        raise HTTPException(400, "Due date cannot be before issue date")

    subtotal_net, vat_total, total_gross, computed_items = _compute_totals(payload)

    language = normalize_lang(payload.language)

    inv = Invoice(
        merchant_id=m.id,
        status=InvoiceStatus.draft,
        series="INV",
        year=payload.issue_date.year,
        number=None,
        invoice_no="",
        issue_date=payload.issue_date,
        due_date=payload.due_date,
        language=language,
        currency=(payload.currency or "EUR")[:8],
        client_name=(payload.client_name or "")[:256],
        client_email=(payload.client_email or "")[:256],
        client_tax_id=(payload.client_tax_id or "")[:64],
        client_address=(payload.client_address or "")[:512],
        discount_percent=float(payload.discount_percent or 0),
        advance_paid=float(payload.advance_paid or 0),
        subtotal_net=subtotal_net,
        vat_total=vat_total,
        total_gross=total_gross,
        notes=(payload.notes or "")[:1024],
    )
    db.add(inv)
    db.flush()

    for idx, it in enumerate(payload.items):
        net, vat, gross = computed_items[idx]
        db.add(InvoiceItem(
            invoice_id=inv.id,
            item_code=(it.item_code or "")[:64],
            description=(it.description or "")[:512],
            unit_price=float(it.unit_price),
            quantity=float(it.quantity),
            vat_rate=float(it.vat_rate),
            line_net=net,
            line_vat=vat,
            line_gross=gross,
        ))

    if payload.issue_now:
        n, inv_no = _issue_number(db, m.id, inv.year)
        inv.number = n
        inv.invoice_no = inv_no
        inv.status = InvoiceStatus.issued
        inv.issued_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(inv)

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
    )


@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = _current_merchant(db, user)
    inv = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.merchant_id == m.id).first()
    if not inv:
        raise HTTPException(404, "Invoice not found")

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
