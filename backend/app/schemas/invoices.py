from datetime import date
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Literal

InvoiceLang = Literal["FR", "EN", "NL"]
CommMode = Literal["simple", "structured"]
InvoiceTemplate = Literal["classic", "modern", "minimal"]


class InvoiceItemIn(BaseModel):
    product_id: Optional[int] = None  # ✅ dropdown produs (opțional)
    item_code: str = ""
    description: str
    unit_price: float
    quantity: float = 1
    vat_rate: float = 0


class InvoiceCreateIn(BaseModel):
    # ✅ alege client existent
    client_id: Optional[int] = None

    # ✅ client nou / completare manuală / import
    client_name: str = ""
    client_email: str = ""
    client_tax_id: str = ""
    client_address: str = ""

    issue_date: date
    due_date: Optional[date] = None

    # ✅ FR default
    language: InvoiceLang = "FR"

    # ✅ doar EUR
    currency: Literal["EUR"] = "EUR"

    # ✅ comunicare simplă/structurată
    communication_mode: CommMode = "simple"
    communication_reference: str = ""

    # ✅ 3 template-uri
    template: InvoiceTemplate = "classic"

    # ✅ discount % + advance
    discount_percent: float = 0
    advance_paid: float = 0

    notes: str = ""

    items: List[InvoiceItemIn] = Field(default_factory=list)

    # ✅ issue now => numerotare + issued
    issue_now: bool = True


class VatBreakdownRow(BaseModel):
    base: float
    vat: float


class InvoiceListOut(BaseModel):
    id: int
    invoice_no: str
    status: str
    issue_date: date
    due_date: Optional[date] = None
    client_name: str
    total_gross: float
    advance_paid: float
    notes: str = ""   # ✅ ADD

class InvoiceItemOut(BaseModel):
    item_code: str
    description: str
    unit_price: float
    quantity: float
    vat_rate: float
    line_net: float
    line_vat: float
    line_gross: float

class InvoiceOut(InvoiceListOut):
    currency: str
    language: str
    subtotal_net: float
    vat_total: float
    notes: str

    items: List[InvoiceItemOut] = Field(default_factory=list)  # ✅ ADD
    discount_percent: float
    discount_amount: float
    total_due: float

    vat_breakdown: Dict[str, VatBreakdownRow] = Field(default_factory=dict)

    communication_mode: str
    communication_reference: str
    template: str
