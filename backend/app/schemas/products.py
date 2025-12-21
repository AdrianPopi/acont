from pydantic import BaseModel
from decimal import Decimal
from typing import Optional

class ProductBase(BaseModel):
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    unit_price: Decimal
    vat_rate: Decimal

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    unit_price: Optional[Decimal] = None
    vat_rate: Optional[Decimal] = None
class ProductOut(ProductBase):
    id: int

    class Config:
        from_attributes = True
