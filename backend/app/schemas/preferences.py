from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from decimal import Decimal

# Account Info
class AccountUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    cui: Optional[str] = None
    communication_email: Optional[str] = None
    client_invoices_email: Optional[str] = None
    supplier_invoices_email: Optional[str] = None

# Bank Details
class BankDetailsBase(BaseModel):
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    bic_code: Optional[str] = None

class BankDetailsCreate(BankDetailsBase):
    pass

class BankDetailsUpdate(BankDetailsBase):
    pass

class BankDetailsResponse(BankDetailsBase):
    id: str
    merchant_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Tax Rates
class TaxRateBase(BaseModel):
    percentage: Decimal = Field(..., ge=0, le=100)
    is_default: bool = False

class TaxRateCreate(TaxRateBase):
    pass

class TaxRateUpdate(TaxRateBase):
    pass

class TaxRateResponse(TaxRateBase):
    id: str
    merchant_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Invoice Template
class InvoiceTemplateBase(BaseModel):
    font_size: int = Field(default=12, ge=8, le=24)
    background_type: str = "none"  # "none", "default1", "default2", "default3", "custom"
    template_style: str = "classic"  # "classic", "modern", "minimal"

class InvoiceTemplateCreate(InvoiceTemplateBase):
    pass

class InvoiceTemplateUpdate(InvoiceTemplateBase):
    logo_url: Optional[str] = None
    background_url: Optional[str] = None

class InvoiceTemplateResponse(InvoiceTemplateBase):
    id: str
    merchant_id: int
    logo_url: Optional[str]
    background_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Subscription Info
class SubscriptionInfoBase(BaseModel):
    plan_name: str
    plan_type: str

class SubscriptionInfoCreate(SubscriptionInfoBase):
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None

class SubscriptionInfoResponse(SubscriptionInfoBase):
    id: str
    merchant_id: int
    valid_from: Optional[datetime]
    valid_until: Optional[datetime]
    is_active: bool
    max_invoices: Optional[int]
    max_clients: Optional[int]
    max_products: Optional[int]
    features: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Email Expenses
class EmailExpensesBase(BaseModel):
    email: EmailStr
    imap_host: Optional[str] = None
    imap_port: int = 993

class EmailExpensesCreate(EmailExpensesBase):
    password: str

class EmailExpensesUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class EmailExpensesResponse(EmailExpensesBase):
    id: str
    merchant_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# PEPPOL Integration
class PeppolIntegrationBase(BaseModel):
    peppol_id: Optional[str] = None

class PeppolIntegrationCreate(PeppolIntegrationBase):
    pass

class PeppolIntegrationUpdate(PeppolIntegrationBase):
    pass

class PeppolIntegrationResponse(PeppolIntegrationBase):
    id: str
    merchant_id: int
    is_integrated: bool
    integration_status: str
    integration_date: Optional[datetime]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Complete Preferences/Settings Response
class PreferencesResponse(BaseModel):
    account_info: Optional[dict] = {}
    bank_details: Optional[BankDetailsResponse] = None
    tax_rates: list[TaxRateResponse] = []
    invoice_template: Optional[InvoiceTemplateResponse] = None
    subscription_info: Optional[SubscriptionInfoResponse] = None
    email_expenses: list[EmailExpensesResponse] = []
    peppol_integration: Optional[PeppolIntegrationResponse] = None
