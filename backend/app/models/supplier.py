from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class Supplier(Base):
    """Furnizor pentru un merchant."""
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), index=True, nullable=False)

    name = Column(String(200), nullable=False)
    email = Column(String(320), nullable=True)
    tax_id = Column(String(50), nullable=True)  # CUI / TVA
    address = Column(String(500), nullable=True)
    peppol_id = Column(String(100), nullable=True)  # PEPPOL ID pentru furnizor
    phone = Column(String(50), nullable=True)
    contact_person = Column(String(200), nullable=True)
    notes = Column(String(1000), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SupplierInvoice(Base):
    """Factură de la furnizor (primită prin PEPPOL sau încărcată manual)."""
    __tablename__ = "supplier_invoices"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), index=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), index=True, nullable=True)

    # Detalii factură
    invoice_no = Column(String(100), nullable=False)  # Numărul facturii de la furnizor
    issue_date = Column(String(20), nullable=False)
    due_date = Column(String(20), nullable=True)
    currency = Column(String(10), default="EUR")
    
    # Totaluri
    total_net = Column(String(50), default="0.00")  # Total fără TVA
    total_vat = Column(String(50), default="0.00")  # Total TVA
    total_gross = Column(String(50), default="0.00")  # Total cu TVA

    # Status
    status = Column(String(50), default="received")  # received, validated, paid, disputed

    # Sursa
    source = Column(String(50), default="manual")  # peppol, manual
    peppol_message_id = Column(String(200), nullable=True)  # ID mesaj PEPPOL dacă e cazul

    # Fișier PDF (dacă e încărcat manual)
    pdf_filename = Column(String(255), nullable=True)
    pdf_path = Column(String(500), nullable=True)

    # Note și descriere
    description = Column(String(500), nullable=True)
    notes = Column(String(1000), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
