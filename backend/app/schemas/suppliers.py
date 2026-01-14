from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ─────────────────────────────────────────────────────────────────
# Supplier Schemas
# ─────────────────────────────────────────────────────────────────

class SupplierCreate(BaseModel):
    name: str
    email: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    peppol_id: Optional[str] = None
    phone: Optional[str] = None
    contact_person: Optional[str] = None
    notes: Optional[str] = None


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    peppol_id: Optional[str] = None
    phone: Optional[str] = None
    contact_person: Optional[str] = None
    notes: Optional[str] = None


class SupplierOut(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    peppol_id: Optional[str] = None
    phone: Optional[str] = None
    contact_person: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────────
# Supplier Invoice Schemas
# ─────────────────────────────────────────────────────────────────

class SupplierInvoiceCreate(BaseModel):
    supplier_id: Optional[int] = None
    invoice_no: str
    issue_date: str
    due_date: Optional[str] = None
    currency: str = "EUR"
    total_net: str = "0.00"
    total_vat: str = "0.00"
    total_gross: str = "0.00"
    status: str = "received"
    description: Optional[str] = None
    notes: Optional[str] = None


class SupplierInvoiceUpdate(BaseModel):
    supplier_id: Optional[int] = None
    invoice_no: Optional[str] = None
    issue_date: Optional[str] = None
    due_date: Optional[str] = None
    currency: Optional[str] = None
    total_net: Optional[str] = None
    total_vat: Optional[str] = None
    total_gross: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None


class SupplierInvoiceOut(BaseModel):
    id: int
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None
    invoice_no: str
    issue_date: str
    due_date: Optional[str] = None
    currency: str = "EUR"
    total_net: str = "0.00"
    total_vat: str = "0.00"
    total_gross: str = "0.00"
    status: str = "received"
    source: str = "manual"
    peppol_message_id: Optional[str] = None
    pdf_filename: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PeppolFetchResult(BaseModel):
    fetched_count: int
    new_suppliers: int
    new_invoices: int
    message: str
