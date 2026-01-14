"""Calendar events API routes."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, extract
from typing import List, Optional
from datetime import datetime, date

from app.api.routes.deps import get_current_user, require_role, get_db
from app.models.user import User, UserRole
from app.models.calendar_event import CalendarEvent
from app.models.merchant import Merchant
from app.models.client import Client
from app.models.invoice import Invoice
from app.schemas.calendar import CalendarEventCreate, CalendarEventOut, CalendarEventUpdate

router = APIRouter(prefix="/calendar", tags=["calendar"])


def _get_merchant_id(db: Session, user: User) -> int:
    """Get merchant ID for current user."""
    merchant = db.query(Merchant).filter(Merchant.owner_user_id == user.id).first()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found for user")
    return merchant.id


@router.get("/", response_model=List[CalendarEventOut])
def get_calendar_events(
    *,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.merchant_admin)),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    year: Optional[int] = None,
    month: Optional[int] = None,
    event_type: Optional[str] = None,
    completed: Optional[bool] = None,
):
    """Get calendar events for merchant with optional filters."""
    merchant_id = _get_merchant_id(db, user)
    
    query = db.query(CalendarEvent).filter(CalendarEvent.merchant_id == merchant_id)
    
    # Filter by year/month
    if year and month:
        query = query.filter(
            and_(
                extract('year', CalendarEvent.start_datetime) == year,
                extract('month', CalendarEvent.start_datetime) == month
            )
        )
    elif year:
        query = query.filter(extract('year', CalendarEvent.start_datetime) == year)
    
    # Filter by type
    if event_type:
        query = query.filter(CalendarEvent.event_type == event_type)
    
    # Filter by completed status
    if completed is not None:
        query = query.filter(CalendarEvent.completed == completed)
    
    # Order by start date
    query = query.order_by(CalendarEvent.start_datetime.desc())
    
    events = query.offset(skip).limit(limit).all()
    
    # Enrich with related data
    result = []
    for event in events:
        event_dict = {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_type": event.event_type.value,
            "start_datetime": event.start_datetime,
            "end_datetime": event.end_datetime,
            "all_day": event.all_day,
            "completed": event.completed,
            "merchant_id": event.merchant_id,
            "client_id": event.client_id,
            "invoice_id": event.invoice_id,
            "created_at": event.created_at,
            "updated_at": event.updated_at,
            "client_name": event.client.name if event.client else None,
            "invoice_no": event.invoice.invoice_no if event.invoice else None,
        }
        result.append(CalendarEventOut(**event_dict))
    
    return result


@router.post("/", response_model=CalendarEventOut, status_code=201)
def create_calendar_event(
    *,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.merchant_admin)),
    event_in: CalendarEventCreate,
):
    """Create new calendar event."""
    merchant_id = _get_merchant_id(db, user)
    
    # Validate dates
    if event_in.end_datetime and event_in.end_datetime < event_in.start_datetime:
        raise HTTPException(status_code=400, detail="End datetime must be after start datetime")
    
    # Validate client exists
    if event_in.client_id:
        client = db.query(Client).filter(
            Client.id == event_in.client_id,
            Client.merchant_id == merchant_id
        ).first()
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
    
    # Validate invoice exists
    if event_in.invoice_id:
        invoice = db.query(Invoice).filter(
            Invoice.id == event_in.invoice_id,
            Invoice.merchant_id == merchant_id
        ).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
    
    event = CalendarEvent(
        **event_in.model_dump(),
        merchant_id=merchant_id,
        created_at=datetime.utcnow()
    )
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    return CalendarEventOut(
        **{
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_type": event.event_type.value,
            "start_datetime": event.start_datetime,
            "end_datetime": event.end_datetime,
            "all_day": event.all_day,
            "completed": event.completed,
            "merchant_id": event.merchant_id,
            "client_id": event.client_id,
            "invoice_id": event.invoice_id,
            "created_at": event.created_at,
            "updated_at": event.updated_at,
            "client_name": event.client.name if event.client else None,
            "invoice_no": event.invoice.invoice_no if event.invoice else None,
        }
    )


@router.get("/{event_id}", response_model=CalendarEventOut)
def get_calendar_event(
    *,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.merchant_admin)),
    event_id: int,
):
    """Get specific calendar event."""
    merchant_id = _get_merchant_id(db, user)
    
    event = db.query(CalendarEvent).filter(
        CalendarEvent.id == event_id,
        CalendarEvent.merchant_id == merchant_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return CalendarEventOut(
        **{
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_type": event.event_type.value,
            "start_datetime": event.start_datetime,
            "end_datetime": event.end_datetime,
            "all_day": event.all_day,
            "completed": event.completed,
            "merchant_id": event.merchant_id,
            "client_id": event.client_id,
            "invoice_id": event.invoice_id,
            "created_at": event.created_at,
            "updated_at": event.updated_at,
            "client_name": event.client.name if event.client else None,
            "invoice_no": event.invoice.invoice_no if event.invoice else None,
        }
    )


@router.put("/{event_id}", response_model=CalendarEventOut)
def update_calendar_event(
    *,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.merchant_admin)),
    event_id: int,
    event_in: CalendarEventUpdate,
):
    """Update calendar event."""
    merchant_id = _get_merchant_id(db, user)
    
    event = db.query(CalendarEvent).filter(
        CalendarEvent.id == event_id,
        CalendarEvent.merchant_id == merchant_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = event_in.model_dump(exclude_unset=True)
    
    # Validate dates if provided
    start = update_data.get("start_datetime", event.start_datetime)
    end = update_data.get("end_datetime", event.end_datetime)
    if end and end < start:
        raise HTTPException(status_code=400, detail="End datetime must be after start datetime")
    
    # Update fields
    for field, value in update_data.items():
        setattr(event, field, value)
    
    event.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(event)
    
    return CalendarEventOut(
        **{
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_type": event.event_type.value,
            "start_datetime": event.start_datetime,
            "end_datetime": event.end_datetime,
            "all_day": event.all_day,
            "completed": event.completed,
            "merchant_id": event.merchant_id,
            "client_id": event.client_id,
            "invoice_id": event.invoice_id,
            "created_at": event.created_at,
            "updated_at": event.updated_at,
            "client_name": event.client.name if event.client else None,
            "invoice_no": event.invoice.invoice_no if event.invoice else None,
        }
    )


@router.delete("/{event_id}", status_code=204)
def delete_calendar_event(
    *,
    db: Session = Depends(get_db),
    user: User = Depends(require_role(UserRole.merchant_admin)),
    event_id: int,
):
    """Delete calendar event."""
    merchant_id = _get_merchant_id(db, user)
    
    event = db.query(CalendarEvent).filter(
        CalendarEvent.id == event_id,
        CalendarEvent.merchant_id == merchant_id
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    
    return None
