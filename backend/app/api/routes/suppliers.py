"""
Suppliers API routes - manage suppliers and their invoices.
"""
import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.routes.deps import get_current_user
from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.merchant import Merchant
from app.models.supplier import Supplier, SupplierInvoice
from app.schemas.suppliers import (
    SupplierCreate, SupplierUpdate, SupplierOut,
    SupplierInvoiceCreate, SupplierInvoiceUpdate, SupplierInvoiceOut,
    PeppolFetchResult
)

router = APIRouter(prefix="/suppliers", tags=["suppliers"])

UPLOAD_DIR = "static/supplier_invoices"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _current_merchant(db: Session, user: User) -> Merchant:
    """Get the merchant for the current user."""
    if user.role != UserRole.merchant_admin:
        raise HTTPException(403, "Only merchants can access suppliers")
    m = db.query(Merchant).filter(Merchant.owner_user_id == user.id).first()
    if not m:
        raise HTTPException(403, "Merchant not found for this user")
    return m


# ─────────────────────────────────────────────────────────────────
# Suppliers CRUD
# ─────────────────────────────────────────────────────────────────

@router.get("", response_model=List[SupplierOut])
def list_suppliers(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all suppliers for current merchant."""
    merchant = _current_merchant(db, user)

    suppliers = (
        db.query(Supplier)
        .filter(Supplier.merchant_id == merchant.id)
        .order_by(Supplier.name)
        .all()
    )
    return suppliers


@router.post("", response_model=SupplierOut)
def create_supplier(
    data: SupplierCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new supplier."""
    merchant = _current_merchant(db, user)

    supplier = Supplier(
        merchant_id=merchant.id,
        name=data.name,
        email=data.email,
        tax_id=data.tax_id,
        address=data.address,
        peppol_id=data.peppol_id,
        phone=data.phone,
        contact_person=data.contact_person,
        notes=data.notes,
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.get("/{supplier_id}", response_model=SupplierOut)
def get_supplier(
    supplier_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single supplier by ID."""
    merchant = _current_merchant(db, user)

    supplier = (
        db.query(Supplier)
        .filter(Supplier.id == supplier_id, Supplier.merchant_id == merchant.id)
        .first()
    )
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.put("/{supplier_id}", response_model=SupplierOut)
def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a supplier."""
    merchant = _current_merchant(db, user)

    supplier = (
        db.query(Supplier)
        .filter(Supplier.id == supplier_id, Supplier.merchant_id == merchant.id)
        .first()
    )
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)

    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a supplier."""
    merchant = _current_merchant(db, user)

    supplier = (
        db.query(Supplier)
        .filter(Supplier.id == supplier_id, Supplier.merchant_id == merchant.id)
        .first()
    )
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    db.delete(supplier)
    db.commit()
    return {"ok": True}


# ─────────────────────────────────────────────────────────────────
# Supplier Invoices
# ─────────────────────────────────────────────────────────────────

@router.get("/invoices/all", response_model=List[SupplierInvoiceOut])
def list_supplier_invoices(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all supplier invoices for current merchant."""
    merchant = _current_merchant(db, user)

    rows = (
        db.query(SupplierInvoice, Supplier.name.label("supplier_name"))
        .outerjoin(Supplier, SupplierInvoice.supplier_id == Supplier.id)
        .filter(SupplierInvoice.merchant_id == merchant.id)
        .order_by(SupplierInvoice.issue_date.desc())
        .all()
    )

    invoices = []
    for inv, supplier_name in rows:
        inv_dict = {
            "id": inv.id,
            "supplier_id": inv.supplier_id,
            "supplier_name": supplier_name,
            "invoice_no": inv.invoice_no,
            "issue_date": inv.issue_date,
            "due_date": inv.due_date,
            "currency": inv.currency,
            "total_net": inv.total_net,
            "total_vat": inv.total_vat,
            "total_gross": inv.total_gross,
            "status": inv.status,
            "source": inv.source,
            "peppol_message_id": inv.peppol_message_id,
            "pdf_filename": inv.pdf_filename,
            "description": inv.description,
            "notes": inv.notes,
            "created_at": inv.created_at,
        }
        invoices.append(SupplierInvoiceOut(**inv_dict))

    return invoices


@router.post("/invoices", response_model=SupplierInvoiceOut)
def create_supplier_invoice(
    data: SupplierInvoiceCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a supplier invoice manually."""
    merchant = _current_merchant(db, user)

    invoice = SupplierInvoice(
        merchant_id=merchant.id,
        supplier_id=data.supplier_id,
        invoice_no=data.invoice_no,
        issue_date=data.issue_date,
        due_date=data.due_date,
        currency=data.currency,
        total_net=data.total_net,
        total_vat=data.total_vat,
        total_gross=data.total_gross,
        status=data.status,
        source="manual",
        description=data.description,
        notes=data.notes,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    # Get supplier name
    supplier_name = None
    if invoice.supplier_id:
        sup = db.query(Supplier.name).filter(Supplier.id == invoice.supplier_id).first()
        if sup:
            supplier_name = sup[0]

    return SupplierInvoiceOut(
        id=invoice.id,
        supplier_id=invoice.supplier_id,
        supplier_name=supplier_name,
        invoice_no=invoice.invoice_no,
        issue_date=invoice.issue_date,
        due_date=invoice.due_date,
        currency=invoice.currency,
        total_net=invoice.total_net,
        total_vat=invoice.total_vat,
        total_gross=invoice.total_gross,
        status=invoice.status,
        source=invoice.source,
        description=invoice.description,
        notes=invoice.notes,
        created_at=invoice.created_at,
    )


@router.post("/invoices/upload")
async def upload_supplier_invoice(
    file: UploadFile = File(...),
    supplier_id: int = Form(None),
    invoice_no: str = Form(...),
    issue_date: str = Form(...),
    due_date: str = Form(None),
    total_net: str = Form("0.00"),
    total_vat: str = Form("0.00"),
    total_gross: str = Form(...),
    description: str = Form(None),
    notes: str = Form(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a PDF invoice from supplier."""
    merchant = _current_merchant(db, user)

    # Validate file type
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Generate unique filename
    unique_id = uuid.uuid4().hex[:8]
    safe_filename = f"{merchant.id}_{unique_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    # Save file
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Create invoice record
    invoice = SupplierInvoice(
        merchant_id=merchant.id,
        supplier_id=supplier_id if supplier_id else None,
        invoice_no=invoice_no,
        issue_date=issue_date,
        due_date=due_date,
        currency="EUR",
        total_net=total_net,
        total_vat=total_vat,
        total_gross=total_gross,
        status="received",
        source="manual",
        pdf_filename=file.filename,
        pdf_path=file_path,
        description=description,
        notes=notes,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    # Get supplier name
    supplier_name = None
    if invoice.supplier_id:
        sup = db.query(Supplier.name).filter(Supplier.id == invoice.supplier_id).first()
        if sup:
            supplier_name = sup[0]

    return SupplierInvoiceOut(
        id=invoice.id,
        supplier_id=invoice.supplier_id,
        supplier_name=supplier_name,
        invoice_no=invoice.invoice_no,
        issue_date=invoice.issue_date,
        due_date=invoice.due_date,
        currency=invoice.currency,
        total_net=invoice.total_net,
        total_vat=invoice.total_vat,
        total_gross=invoice.total_gross,
        status=invoice.status,
        source=invoice.source,
        pdf_filename=invoice.pdf_filename,
        description=invoice.description,
        notes=invoice.notes,
        created_at=invoice.created_at,
    )


@router.get("/invoices/{invoice_id}", response_model=SupplierInvoiceOut)
def get_supplier_invoice(
    invoice_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single supplier invoice."""
    merchant = _current_merchant(db, user)

    row = (
        db.query(SupplierInvoice, Supplier.name.label("supplier_name"))
        .outerjoin(Supplier, SupplierInvoice.supplier_id == Supplier.id)
        .filter(
            SupplierInvoice.id == invoice_id,
            SupplierInvoice.merchant_id == merchant.id
        )
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Invoice not found")

    inv, supplier_name = row
    return SupplierInvoiceOut(
        id=inv.id,
        supplier_id=inv.supplier_id,
        supplier_name=supplier_name,
        invoice_no=inv.invoice_no,
        issue_date=inv.issue_date,
        due_date=inv.due_date,
        currency=inv.currency,
        total_net=inv.total_net,
        total_vat=inv.total_vat,
        total_gross=inv.total_gross,
        status=inv.status,
        source=inv.source,
        peppol_message_id=inv.peppol_message_id,
        pdf_filename=inv.pdf_filename,
        description=inv.description,
        notes=inv.notes,
        created_at=inv.created_at,
    )


@router.put("/invoices/{invoice_id}", response_model=SupplierInvoiceOut)
def update_supplier_invoice(
    invoice_id: int,
    data: SupplierInvoiceUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a supplier invoice."""
    merchant = _current_merchant(db, user)

    invoice = (
        db.query(SupplierInvoice)
        .filter(
            SupplierInvoice.id == invoice_id,
            SupplierInvoice.merchant_id == merchant.id
        )
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(invoice, field, value)

    db.commit()
    db.refresh(invoice)

    # Get supplier name
    supplier_name = None
    if invoice.supplier_id:
        sup = db.query(Supplier.name).filter(Supplier.id == invoice.supplier_id).first()
        if sup:
            supplier_name = sup[0]

    return SupplierInvoiceOut(
        id=invoice.id,
        supplier_id=invoice.supplier_id,
        supplier_name=supplier_name,
        invoice_no=invoice.invoice_no,
        issue_date=invoice.issue_date,
        due_date=invoice.due_date,
        currency=invoice.currency,
        total_net=invoice.total_net,
        total_vat=invoice.total_vat,
        total_gross=invoice.total_gross,
        status=invoice.status,
        source=invoice.source,
        pdf_filename=invoice.pdf_filename,
        description=invoice.description,
        notes=invoice.notes,
        created_at=invoice.created_at,
    )


@router.delete("/invoices/{invoice_id}")
def delete_supplier_invoice(
    invoice_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a supplier invoice."""
    merchant = _current_merchant(db, user)

    invoice = (
        db.query(SupplierInvoice)
        .filter(
            SupplierInvoice.id == invoice_id,
            SupplierInvoice.merchant_id == merchant.id
        )
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Delete PDF file if exists
    if invoice.pdf_path and os.path.exists(invoice.pdf_path):
        try:
            os.remove(invoice.pdf_path)
        except OSError:
            pass

    db.delete(invoice)
    db.commit()
    return {"ok": True}


@router.get("/invoices/{invoice_id}/pdf")
def download_supplier_invoice_pdf(
    invoice_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download the PDF of a supplier invoice."""
    merchant = _current_merchant(db, user)

    invoice = (
        db.query(SupplierInvoice)
        .filter(
            SupplierInvoice.id == invoice_id,
            SupplierInvoice.merchant_id == merchant.id
        )
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if not invoice.pdf_path or not os.path.exists(invoice.pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")

    return FileResponse(
        invoice.pdf_path,
        media_type="application/pdf",
        filename=invoice.pdf_filename or f"invoice_{invoice_id}.pdf"
    )


# ─────────────────────────────────────────────────────────────────
# PEPPOL Integration (Placeholder)
# ─────────────────────────────────────────────────────────────────

@router.post("/peppol/fetch", response_model=PeppolFetchResult)
def fetch_peppol_invoices(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch invoices from PEPPOL network.
    This is a placeholder - actual PEPPOL integration requires:
    - Access Point connection
    - AS4 protocol handling
    - UBL parsing
    """
    _current_merchant(db, user)  # Just validate access

    # TODO: Implement actual PEPPOL fetch
    # For now, return a placeholder response
    return PeppolFetchResult(
        fetched_count=0,
        new_suppliers=0,
        new_invoices=0,
        message="PEPPOL integration pending configuration. Contact support to activate."
    )
