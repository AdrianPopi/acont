from datetime import date
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

InvoiceLang = Literal["FR", "EN", "NL"]
CommMode = Literal["simple", "structured"]
Template = Literal["classic", "modern", "minimal"]


class EligibleInvoiceOut(BaseModel):
    id: int
    invoice_no: str
    issue_date: date
    client_name: str
    total_gross: float


class SourceInvoiceItemOut(BaseModel):
    item_code: str
    description: str
    unit_price: float
    quantity: float
    vat_rate: float
    line_net: float
    line_vat: float
    line_gross: float


class SourceInvoiceOut(BaseModel):
    id: int
    invoice_no: str
    issue_date: date
    client_id: Optional[int] = None
    client_name: str
    client_email: str
    client_tax_id: str
    client_address: str
    language: str
    currency: str
    subtotal_net: float
    vat_total: float
    total_gross: float
    items: List[SourceInvoiceItemOut] = Field(default_factory=list)


class CreditNoteCreateIn(BaseModel):
    invoice_id: int

    # same rules ca invoice: azi by default, manual allowed
    issue_date: date

    language: InvoiceLang = "FR"
    currency: Literal["EUR"] = "EUR"

    communication_mode: CommMode = "simple"
    communication_reference: str = ""

    template: Template = "classic"
    notes: str = ""

    issue_now: bool = True


class CreditNoteListOut(BaseModel):
    id: int
    credit_note_no: str
    status: str
    issue_date: date
    client_name: str
    invoice_no: str
    total_gross: float


class CreditNoteOut(CreditNoteListOut):
    currency: str
    language: str
    subtotal_net: float
    vat_total: float
    notes: str
    communication_mode: str
    communication_reference: str
    template: str
