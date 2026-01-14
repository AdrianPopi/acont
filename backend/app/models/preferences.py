from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, DECIMAL
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base
import uuid

class BankDetails(Base):
    """Bank account details for merchant"""
    __tablename__ = "bank_details"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, unique=True)
    
    bank_name = Column(String, nullable=True)
    account_number = Column(String, nullable=True)
    bic_code = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    merchant = relationship("Merchant", back_populates="bank_details")

class TaxRate(Base):
    """Custom tax rates for merchant"""
    __tablename__ = "tax_rates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    
    percentage = Column(DECIMAL(5, 2), nullable=False)  # 0.00 to 99.99
    is_default = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    merchant = relationship("Merchant", back_populates="tax_rates")

class InvoiceTemplate(Base):
    """Invoice template customization"""
    __tablename__ = "invoice_templates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, unique=True)
    
    logo_url = Column(String, nullable=True)  # Path to uploaded logo
    background_url = Column(String, nullable=True)  # Path to background
    font_size = Column(Integer, default=12)  # 12, 14, 16
    background_type = Column(String, default="none")  # "none", "default1", "default2", "default3", "custom"
    template_style = Column(String, default="classic")  # "classic", "modern", "minimal"
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    merchant = relationship("Merchant", back_populates="invoice_template")

class SubscriptionInfo(Base):
    """Subscription/Plan information"""
    __tablename__ = "subscription_info"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, unique=True)
    
    plan_name = Column(String, nullable=False)  # "Free", "Starter", "Pro", "Enterprise"
    plan_type = Column(String, nullable=False)  # Subscription type
    valid_from = Column(DateTime, nullable=True)
    valid_until = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    max_invoices = Column(Integer, nullable=True)  # -1 for unlimited
    max_clients = Column(Integer, nullable=True)
    max_products = Column(Integer, nullable=True)
    features = Column(Text, nullable=True)  # JSON array of features
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    merchant = relationship("Merchant", back_populates="subscription_info")

class EmailExpenses(Base):
    """Email account for expense/bill collection"""
    __tablename__ = "email_expenses"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    
    email = Column(String, nullable=False)
    password_encrypted = Column(String, nullable=True)  # Encrypted
    is_active = Column(Boolean, default=True)
    imap_host = Column(String, nullable=True)
    imap_port = Column(Integer, default=993)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    merchant = relationship("Merchant", back_populates="email_expenses")

class PeppolIntegration(Base):
    """PEPPOL integration details"""
    __tablename__ = "peppol_integration"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, unique=True)
    
    peppol_id = Column(String, nullable=True, unique=True)
    is_integrated = Column(Boolean, default=False)
    integration_status = Column(String, default="not_started")  # "not_started", "pending", "active", "failed"
    integration_date = Column(DateTime, nullable=True)
    error_message = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    merchant = relationship("Merchant", back_populates="peppol_integration")
