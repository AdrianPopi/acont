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
    code: Optional[str]
    name: Optional[str]
    description: Optional[str]
    unit_price: Optional[Decimal]
    vat_rate: Optional[Decimal]

class ProductOut(ProductBase):
    id: int

    class Config:
        from_attributes = True
