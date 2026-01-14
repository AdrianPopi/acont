"""Pydantic schemas for calendar events."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class CalendarEventBase(BaseModel):
    """Base schema for calendar events."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    event_type: str = "other"  # meeting, deadline, reminder, invoice_due, payment, other
    start_datetime: datetime
    end_datetime: Optional[datetime] = None
    all_day: bool = False
    completed: bool = False
    client_id: Optional[int] = None
    invoice_id: Optional[int] = None


class CalendarEventCreate(CalendarEventBase):
    """Schema for creating calendar event."""
    pass


class CalendarEventUpdate(BaseModel):
    """Schema for updating calendar event."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    event_type: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    all_day: Optional[bool] = None
    completed: Optional[bool] = None
    client_id: Optional[int] = None
    invoice_id: Optional[int] = None


class CalendarEventOut(CalendarEventBase):
    """Schema for calendar event output."""
    id: int
    merchant_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Optional expanded data
    client_name: Optional[str] = None
    invoice_no: Optional[str] = None

    class Config:
        from_attributes = True
