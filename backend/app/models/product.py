from sqlalchemy import Column, Integer, String, ForeignKey, Numeric
from app.db.base import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), index=True)

    code = Column(String(50), nullable=True)
    name = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)

    unit_price = Column(Numeric(10, 2), nullable=False)
    vat_rate = Column(Numeric(5, 2), nullable=False, default=0)
