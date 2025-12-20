from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.base import Base

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), index=True)

    name = Column(String(200), nullable=False)
    email = Column(String(320), nullable=True)
    tax_id = Column(String(50), nullable=True)
    address = Column(String(500), nullable=True)
