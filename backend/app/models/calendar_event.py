"""Calendar Event model for scheduling and reminders."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum


class EventType(str, enum.Enum):
    """Event types for calendar."""
    meeting = "meeting"
    deadline = "deadline"
    reminder = "reminder"
    invoice_due = "invoice_due"
    payment = "payment"
    other = "other"


class CalendarEvent(Base):
    """Calendar event model."""
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    
    # Basic info
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(Enum(EventType), default=EventType.other, nullable=False)
    
    # Timing
    start_datetime = Column(DateTime, nullable=False, index=True)
    end_datetime = Column(DateTime, nullable=True)
    all_day = Column(Boolean, default=False, nullable=False)
    
    # Status
    completed = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    merchant = relationship("Merchant", back_populates="calendar_events")
    
    # Optional links
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    client = relationship("Client")
    
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    invoice = relationship("Invoice")
    
    # Metadata
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<CalendarEvent(id={self.id}, title='{self.title}', type={self.event_type})>"
