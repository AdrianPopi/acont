from datetime import datetime, timezone, date
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.routes.deps import get_current_user
from app.models.user import User, UserRole
from app.models.merchant import Merchant
from app.models.client import Client
from app.models.invoice import Invoice, InvoiceStatus
from app.models.invoice_item import InvoiceItem
from app.models.invoice_sequence import InvoiceSequence

from app.models.credit_note import CreditNote, CreditNoteStatus
from app.models.credit_note_item import CreditNoteItem

from app.schemas.credit_notes import (
    EligibleInvoiceOut, SourceInvoiceOut, SourceInvoiceItemOut,
    CreditNoteCreateIn, CreditNoteListOut, CreditNoteOut
)

from app.core.credit_note_pdf import build_credit_note_pdf
from app.core.usage_tracking import check_and_increment_usage, get_subscription_for_merchant


router = APIRouter(prefix="/credit-notes", tags=["credit-notes"])


def normalize_lang(v: str | None) -> str:
    if not v:
        return "FR"
    v = v.strip().upper()
    return v if v in ("FR", "EN", "NL") else "FR"


def _current_merchant(db: Session, user: User) -> Merchant:
    if user.role != UserRole.merchant_admin:
        raise HTTPException(403, "Only merchants can access credit notes")
    m = db.query(Merchant).filter(Merchant.owner_user_id == user.id).first()
    if not m:
        raise HTTPException(403, "Merchant not found for this user")
    return m


def _structured_reference_from_id(doc_id: int) -> str:
    raw10 = f"{doc_id:010d}"
    n = int(raw10)
    mod = n % 97
    if mod == 0:
        mod = 97
    return f"+++{raw10[:3]}/{raw10[3:7]}/{raw10[7:]}{mod:02d}+++"


def _issue_cn_number(db: Session, merchant_id: int, year: int) -> tuple[int, str]:
    seq = (
        db.query(InvoiceSequence)
        .filter(
            InvoiceSequence.merchant_id == merchant_id,
            InvoiceSequence.year == year,
            InvoiceSequence.doc_type == "credit_note",
        )
        .with_for_update()
        .first()
    )
    if not seq:
        seq = InvoiceSequence(merchant_id=merchant_id, year=year, doc_type="credit_note", next_number=1)
        db.add(seq)
        db.flush()

    n = int(seq.next_number)
    seq.next_number = n + 1

    # ✅ anual: 000001
    cn_no = f"{n:06d}"
    return n, cn_no


@router.get("/eligible-invoices", response_model=list[EligibleInvoiceOut])
def eligible_invoices(
    client_id: int = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m = _current_merchant(db, user)

    rows = (
        db.query(Invoice)
        .filter(
            Invoice.merchant_id == m.id,
            Invoice.status == InvoiceStatus.issued,
            Invoice.client_id == client_id,
        )
        .order_by(Invoice.issue_date.desc(), Invoice.id.desc())
        .limit(300)
        .all()
    )

    return [
        EligibleInvoiceOut(
            id=r.id,
            invoice_no=r.invoice_no,
            issue_date=r.issue_date,
            client_name=r.client_name,
            total_gross=float(r.total_gross),
        )
        for r in rows
    ]


@router.get("/source-invoice/{invoice_id}", response_model=SourceInvoiceOut)
def source_invoice(
    invoice_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m = _current_merchant(db, user)

    inv = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.merchant_id == m.id,
        Invoice.status == InvoiceStatus.issued,
    ).first()
    if not inv:
        raise HTTPException(404, "Invoice not found")

    items = db.query(InvoiceItem).filter(InvoiceItem.invoice_id == inv.id).all()

    return SourceInvoiceOut(
        id=inv.id,
        invoice_no=inv.invoice_no,
        issue_date=inv.issue_date,
        client_id=inv.client_id,
        client_name=inv.client_name,
        client_email=inv.client_email,
        client_tax_id=inv.client_tax_id,
        client_address=inv.client_address,
        language=inv.language,
        currency=inv.currency,
        subtotal_net=float(inv.subtotal_net),
        vat_total=float(inv.vat_total),
        total_gross=float(inv.total_gross),
        items=[
            SourceInvoiceItemOut(
                item_code=i.item_code,
                description=i.description,
                unit_price=float(i.unit_price),
                quantity=float(i.quantity),
                vat_rate=float(i.vat_rate),
                line_net=float(i.line_net),
                line_vat=float(i.line_vat),
                line_gross=float(i.line_gross),
            )
            for i in items
        ],
    )


@router.get("/meta")
def credit_notes_meta(
    issue_date: date = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    m = _current_merchant(db, user)

    last = (
        db.query(CreditNote)
        .filter(CreditNote.merchant_id == m.id, CreditNote.status == CreditNoteStatus.issued)
        .order_by(CreditNote.issue_date.desc(), CreditNote.id.desc())
        .first()
    )
    last_date = last.issue_date if last else None

    year = issue_date.year
    seq = (
        db.query(InvoiceSequence)
        .filter(
            InvoiceSequence.merchant_id == m.id,
            InvoiceSequence.year == year,
            InvoiceSequence.doc_type == "credit_note",
        )
        .first()
    )
    next_n = int(seq.next_number) if seq else 1
    next_no = f"{next_n:06d}"

    return {"last_issued_date": last_date, "next_credit_note_no": next_no}


@router.get("", response_model=list[CreditNoteListOut])
def list_credit_notes(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = _current_merchant(db, user)

    rows = (
        db.query(CreditNote)
        .filter(CreditNote.merchant_id == m.id)
        .order_by(CreditNote.issue_date.desc(), CreditNote.id.desc())
        .limit(200)
        .all()
    )

    # join invoice_no
    inv_map = {r.invoice_id: r2.invoice_no for r, r2 in []}  # placeholder

    invoice_ids = list({r.invoice_id for r in rows})
    if invoice_ids:
        invs = db.query(Invoice).filter(Invoice.id.in_(invoice_ids)).all()
        inv_map = {i.id: i.invoice_no for i in invs}
    else:
        inv_map = {}

    return [
        CreditNoteListOut(
            id=r.id,
            credit_note_no=r.credit_note_no or "DRAFT",
            status=r.status.value,
            issue_date=r.issue_date,
            client_name=r.client_name,
            invoice_no=inv_map.get(r.invoice_id, ""),
            total_gross=float(r.total_gross),
        )
        for r in rows
    ]


@router.post("", response_model=CreditNoteOut)
def create_credit_note(payload: CreditNoteCreateIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = _current_merchant(db, user)

    if (payload.currency or "EUR").upper() != "EUR":
        raise HTTPException(400, "Only EUR is supported")

    # ✅ invoice to credit
    inv = db.query(Invoice).filter(
        Invoice.id == payload.invoice_id,
        Invoice.merchant_id == m.id,
        Invoice.status == InvoiceStatus.issued,
    ).first()
    if not inv:
        raise HTTPException(404, "Invoice not found")

    today = datetime.now(timezone.utc).date()
    if payload.issue_date > today:
        raise HTTPException(400, "Issue date cannot be in the future")

    # ✅ credit note date must be >= invoice date
    if payload.issue_date < inv.issue_date:
        raise HTTPException(400, "Credit note date cannot be before invoice issue date")

    # ✅ order rule for CN: cannot be before last issued CN date
    last = (
        db.query(CreditNote)
        .filter(CreditNote.merchant_id == m.id, CreditNote.status == CreditNoteStatus.issued)
        .order_by(CreditNote.issue_date.desc(), CreditNote.id.desc())
        .first()
    )
    if last and payload.issue_date < last.issue_date:
        raise HTTPException(400, f"Issue date cannot be before last issued credit note date ({last.issue_date.isoformat()})")

    language = normalize_lang(payload.language or inv.language)
    template = (payload.template or "classic").strip().lower()

    comm_mode = (payload.communication_mode or "simple").strip().lower()
    if comm_mode not in ("simple", "structured"):
        comm_mode = "simple"
    comm_ref = (payload.communication_reference or "").strip()

    cn = CreditNote(
        merchant_id=m.id,
        invoice_id=inv.id,
        client_id=inv.client_id,

        status=CreditNoteStatus.draft,
        series="CN",
        year=payload.issue_date.year,
        number=None,
        credit_note_no="",

        issue_date=payload.issue_date,
        language=language,
        currency="EUR",

        communication_mode=comm_mode,
        communication_reference="",
        template=template,

        client_name=inv.client_name,
        client_email=inv.client_email,
        client_tax_id=inv.client_tax_id,
        client_address=inv.client_address,

        subtotal_net=0,
        vat_total=0,
        total_gross=0,

        notes=(payload.notes or "")[:1024],
    )
    db.add(cn)
    db.flush()

    # structured ref auto
    if comm_mode == "structured":
        if not comm_ref:
            comm_ref = _structured_reference_from_id(cn.id)
        cn.communication_reference = comm_ref
    else:
        cn.communication_reference = ""

    # ✅ copy invoice items but NEGATIVE amounts
    inv_items = db.query(InvoiceItem).filter(InvoiceItem.invoice_id == inv.id).all()

    subtotal_net = 0.0
    vat_total = 0.0
    total_gross = 0.0

    for it in inv_items:
        net = -float(it.line_net)
        vat = -float(it.line_vat)
        gross = -float(it.line_gross)

        subtotal_net += net
        vat_total += vat
        total_gross += gross

        db.add(CreditNoteItem(
            credit_note_id=cn.id,
            item_code=it.item_code,
            description=it.description,
            unit_price=float(it.unit_price),
            quantity=float(it.quantity),
            vat_rate=float(it.vat_rate),
            line_net=net,
            line_vat=vat,
            line_gross=gross,
        ))

    cn.subtotal_net = subtotal_net
    cn.vat_total = vat_total
    cn.total_gross = total_gross

    if payload.issue_now:
        n, cn_no = _issue_cn_number(db, m.id, cn.year)
        cn.number = n
        cn.credit_note_no = cn_no
        cn.status = CreditNoteStatus.issued
        cn.issued_at = datetime.now(timezone.utc)
        
        # ✅ Track usage when credit note is issued
        subscription = get_subscription_for_merchant(db, m)
        if subscription:
            is_over_limit, usage_warning = check_and_increment_usage(db, subscription, document_count=1)

    db.commit()
    db.refresh(cn)

    return CreditNoteOut(
        id=cn.id,
        credit_note_no=cn.credit_note_no or "DRAFT",
        status=cn.status.value,
        issue_date=cn.issue_date,
        client_name=cn.client_name,
        invoice_no=inv.invoice_no,
        total_gross=float(cn.total_gross),

        currency=cn.currency,
        language=cn.language,
        subtotal_net=float(cn.subtotal_net),
        vat_total=float(cn.vat_total),
        notes=cn.notes,
        communication_mode=cn.communication_mode,
        communication_reference=cn.communication_reference,
        template=cn.template,
    )


@router.get("/{credit_note_id}/pdf")
def download_credit_note_pdf(credit_note_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    m = _current_merchant(db, user)
    cn = db.query(CreditNote).filter(CreditNote.id == credit_note_id, CreditNote.merchant_id == m.id).first()
    if not cn:
        raise HTTPException(404, "Credit note not found")

    pdf = build_credit_note_pdf(cn, merchant_logo_url=m.logo_url)
    filename = (cn.credit_note_no or f"credit-note-{cn.id}") + ".pdf"

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
