from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.routes.deps import get_current_user, get_current_merchant
from app.models.user import User
from app.models.preferences import (
    BankDetails, TaxRate, InvoiceTemplate, 
    SubscriptionInfo, EmailExpenses, PeppolIntegration
)
from app.schemas.preferences import (
    BankDetailsCreate, BankDetailsUpdate, BankDetailsResponse,
    TaxRateCreate, TaxRateUpdate, TaxRateResponse,
    InvoiceTemplateCreate, InvoiceTemplateUpdate, InvoiceTemplateResponse,
    SubscriptionInfoCreate, SubscriptionInfoResponse,
    EmailExpensesCreate, EmailExpensesUpdate, EmailExpensesResponse,
    PeppolIntegrationCreate, PeppolIntegrationUpdate, PeppolIntegrationResponse,
    PreferencesResponse
)
from app.models.merchant import Merchant
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.core.security import hash_password, verify_password

router = APIRouter(prefix="/preferences", tags=["preferences"])

# Helper to get merchant
async def get_merchant(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Merchant:
    merchant = db.query(Merchant).filter(
        Merchant.owner_user_id == current_user.id
    ).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return merchant

# ==================== ALL PREFERENCES ====================
@router.get("/", response_model=PreferencesResponse, summary="Get all preferences")
async def get_all_preferences(
    merchant: Merchant = Depends(get_merchant),
    db: Session = Depends(get_db)
):
    """Get all preferences/settings for current merchant"""
    return PreferencesResponse(
        bank_details=merchant.bank_details,
        tax_rates=merchant.tax_rates,
        invoice_template=merchant.invoice_template,
        subscription_info=merchant.subscription_info,
        email_expenses=merchant.email_expenses,
        peppol_integration=merchant.peppol_integration
    )

# ==================== BANK DETAILS ====================
@router.get("/bank", response_model=BankDetailsResponse, summary="Get bank details")
async def get_bank_details(
    merchant: Merchant = Depends(get_merchant),
    db: Session = Depends(get_db)
):
    """Get merchant bank details"""
    if not merchant.bank_details:
        # Create default empty record
        bank = BankDetails(merchant_id=str(merchant.id))
        db.add(bank)
        db.commit()
        db.refresh(bank)
        return bank
    return merchant.bank_details

@router.put("/bank", response_model=BankDetailsResponse, summary="Update bank details")
async def update_bank_details(
    data: BankDetailsUpdate,
    merchant: Merchant = Depends(get_merchant),
    db: Session = Depends(get_db)
):
    """Update merchant bank details"""
    bank = merchant.bank_details
    if not bank:
        bank = BankDetails(merchant_id=str(merchant.id))
        db.add(bank)
    
    for field, value in data.dict(exclude_unset=True).items():
        setattr(bank, field, value)
    
    db.commit()
    db.refresh(bank)
    return bank

# ==================== TAX RATES ====================
@router.get("/tax-rates", response_model=list[TaxRateResponse], summary="Get tax rates")
async def get_tax_rates(
    merchant: Merchant = Depends(get_merchant),
    db: Session = Depends(get_db)
):
    """Get all tax rates for merchant"""
    return merchant.tax_rates

@router.post("/tax-rates", response_model=TaxRateResponse, status_code=201, summary="Create tax rate")
async def create_tax_rate(
    data: TaxRateCreate,
    merchant: Merchant = Depends(get_merchant),
    db: Session = Depends(get_db)
):
    """Create new tax rate"""
    rate = TaxRate(merchant_id=str(merchant.id), **data.dict())
    db.add(rate)
    db.commit()
    db.refresh(rate)
    return rate

@router.put("/tax-rates/{rate_id}", response_model=TaxRateResponse, summary="Update tax rate")
async def update_tax_rate(
    rate_id: str,
    data: TaxRateUpdate,
    merchant: Merchant = Depends(get_merchant),
    db: Session = Depends(get_db)
):
    """Update tax rate"""
    rate = db.query(TaxRate).filter(
        TaxRate.id == rate_id,
        TaxRate.merchant_id == str(merchant.id)
    ).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Tax rate not found")
    
    for field, value in data.dict(exclude_unset=True).items():
        setattr(rate, field, value)
    
    db.commit()
    db.refresh(rate)
    return rate

@router.delete("/tax-rates/{rate_id}", status_code=204, summary="Delete tax rate")
async def delete_tax_rate(
    rate_id: str,
    merchant: Merchant = Depends(get_merchant),
    db: Session = Depends(get_db)
):
    """Delete tax rate"""
    rate = db.query(TaxRate).filter(
        TaxRate.id == rate_id,
        TaxRate.merchant_id == str(merchant.id)
    ).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Tax rate not found")
    
    db.delete(rate)
    db.commit()

# ==================== INVOICE TEMPLATE ====================
@router.get("/invoice-template", response_model=InvoiceTemplateResponse, summary="Get invoice template")
async def get_invoice_template(
    merchant: Merchant = Depends(get_merchant),
    db: Session = Depends(get_db)
):
    """Get invoice template settings"""
    if not merchant.invoice_template:
        template = InvoiceTemplate(merchant_id=str(merchant.id))
        db.add(template)
        db.commit()
        db.refresh(template)
        return template
    return merchant.invoice_template

@router.put("/invoice-template", response_model=InvoiceTemplateResponse, summary="Update invoice template")
async def update_invoice_template(
    data: InvoiceTemplateUpdate,
    merchant: Merchant = Depends(get_merchant),
    db: Session = Depends(get_db)
):
    """Update invoice template settings"""
    template = merchant.invoice_template
    if not template:
        template = InvoiceTemplate(merchant_id=str(merchant.id))
        db.add(template)
    
    for field, value in data.dict(exclude_unset=True).items():
        setattr(template, field, value)
    
    db.commit()
    db.refresh(template)
    return template

# ==================== SUBSCRIPTION INFO ====================
@router.get("/subscription", response_model=SubscriptionInfoResponse, summary="Get subscription info")
async def get_subscription(
    merchant: Merchant = Depends(get_merchant),
    db: Session = Depends(get_db)
):
    """Get subscription/plan information"""
    if not merchant.subscription_info:
        raise HTTPException(status_code=404, detail="Subscription info not found")
    return merchant.subscription_info

# ==================== EMAIL EXPENSES ====================
@router.get("/email-expenses", response_model=list[EmailExpensesResponse], summary="Get email accounts")
async def get_email_expenses(
    merchant: Merchant = Depends(get_merchant),
    db: Session = Depends(get_db)
):
    """Get all email accounts for expenses/bills"""
    return merchant.email_expenses

@router.post("/email-expenses", response_model=EmailExpensesResponse, status_code=201, summary="Add email account")
async def create_email_expense(
    data: EmailExpensesCreate,
    merchant: Merchant = Depends(get_merchant),
    db: Session = Depends(get_db)
):
    """Add new email account for expense collection"""
    email = EmailExpenses(
        merchant_id=str(merchant.id),
        email=data.email,
        password_encrypted=data.password,  # TODO: Implement encryption
        imap_host=data.imap_host,
        imap_port=data.imap_port
    )
    db.add(email)
    db.commit()
    db.refresh(email)
    return email

@router.put("/email-expenses/{email_id}", response_model=EmailExpensesResponse, summary="Update email account")
async def update_email_expense(
    email_id: str,
    data: EmailExpensesUpdate,
    merchant: Merchant = Depends(get_merchant),
    db: Session = Depends(get_db)
):
    """Update email account"""
    email = db.query(EmailExpenses).filter(
        EmailExpenses.id == email_id,
        EmailExpenses.merchant_id == str(merchant.id)
    ).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    for field, value in data.dict(exclude_unset=True).items():
        setattr(email, field, value)
    
    db.commit()
    db.refresh(email)
    return email

@router.delete("/email-expenses/{email_id}", status_code=204, summary="Delete email account")
async def delete_email_expense(
    email_id: str,
    merchant: Merchant = Depends(get_merchant),
    db: Session = Depends(get_db)
):
    """Delete email account"""
    email = db.query(EmailExpenses).filter(
        EmailExpenses.id == email_id,
        EmailExpenses.merchant_id == str(merchant.id)
    ).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    db.delete(email)
    db.commit()

# ==================== PEPPOL INTEGRATION ====================
@router.get("/peppol", response_model=PeppolIntegrationResponse, summary="Get PEPPOL status")
async def get_peppol_integration(
    merchant: Merchant = Depends(get_merchant),
    db: Session = Depends(get_db)
):
    """Get PEPPOL integration status"""
    if not merchant.peppol_integration:
        peppol = PeppolIntegration(merchant_id=str(merchant.id))
        db.add(peppol)
        db.commit()
        db.refresh(peppol)
        return peppol
    return merchant.peppol_integration

@router.put("/peppol", response_model=PeppolIntegrationResponse, summary="Update PEPPOL ID")
async def update_peppol_integration(
    data: PeppolIntegrationUpdate,
    merchant: Merchant = Depends(get_merchant),
    db: Session = Depends(get_db)
):
    """Update PEPPOL ID"""
    peppol = merchant.peppol_integration
    if not peppol:
        peppol = PeppolIntegration(merchant_id=str(merchant.id))
        db.add(peppol)
    
    for field, value in data.dict(exclude_unset=True).items():
        setattr(peppol, field, value)
    
    db.commit()
    db.refresh(peppol)
    return peppol


# ==================== ACCOUNT ====================
class AccountUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    cui: Optional[str] = None
    communication_email: Optional[str] = None
    client_invoices_email: Optional[str] = None
    supplier_invoices_email: Optional[str] = None


@router.get("/account")
async def get_account(
    current_user: User = Depends(get_current_user),
    merchant: Merchant = Depends(get_current_merchant),
):
    """Get user and merchant account info"""
    return {
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "phone": merchant.phone,
        "company_name": merchant.company_name,
        "cui": merchant.cui,
        "communication_email": merchant.communication_email,
        "client_invoices_email": merchant.client_invoices_email,
        "supplier_invoices_email": merchant.supplier_invoices_email,
    }


@router.post("/account")
async def update_account(
    data: AccountUpdate,
    current_user: User = Depends(get_current_user),
    merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """Update user and merchant account info"""
    # Update user fields
    if data.first_name is not None:
        current_user.first_name = data.first_name
    if data.last_name is not None:
        current_user.last_name = data.last_name
    
    # Update merchant fields
    if data.phone is not None:
        merchant.phone = data.phone
    if data.company_name is not None:
        merchant.company_name = data.company_name
    if data.cui is not None:
        merchant.cui = data.cui
    if data.communication_email is not None:
        merchant.communication_email = data.communication_email
    if data.client_invoices_email is not None:
        merchant.client_invoices_email = data.client_invoices_email
    if data.supplier_invoices_email is not None:
        merchant.supplier_invoices_email = data.supplier_invoices_email
    
    db.add(current_user)
    db.add(merchant)
    db.commit()
    db.refresh(current_user)
    db.refresh(merchant)
    
    return {
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "phone": merchant.phone,
        "company_name": merchant.company_name,
        "cui": merchant.cui,
        "communication_email": merchant.communication_email,
        "client_invoices_email": merchant.client_invoices_email,
        "supplier_invoices_email": merchant.supplier_invoices_email,
    }
