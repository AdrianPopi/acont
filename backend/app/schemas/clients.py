from pydantic import BaseModel
from typing import Optional

class ClientBase(BaseModel):
    name: str
    email: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    peppol_id: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(ClientBase):
    pass

class ClientOut(ClientBase):
    id: int

    class Config:
        from_attributes = True
