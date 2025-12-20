from datetime import date
from pydantic import BaseModel, Field
from typing import List, Optional


class InvoiceItemIn(BaseModel):
    item_code: str = ""
    description: str
    unit_price: float
    quantity: float = 1
    vat_rate: float = 0


class InvoiceCreateIn(BaseModel):
    client_name: str
    client_email: str = ""
    client_tax_id: str = ""
    client_address: str = ""

    issue_date: date
    due_date: Optional[date] = None

    language: str = "fr"   # fr/en/nl
    currency: str = "EUR"

    discount_percent: float = 0
    advance_paid: float = 0
    notes: str = ""

    items: List[InvoiceItemIn] = Field(default_factory=list)

    issue_now: bool = True  # dacă True -> numerotare + status=issued


class InvoiceListOut(BaseModel):
    id: int
    invoice_no: str
    status: str
    issue_date: date
    due_date: Optional[date] = None
    client_name: str
    total_gross: float
    advance_paid: float


class InvoiceOut(InvoiceListOut):
    currency: str
    language: str
    subtotal_net: float
    vat_total: float
    notes: str
