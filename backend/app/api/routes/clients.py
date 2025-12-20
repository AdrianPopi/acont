from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.api.routes.deps import get_current_user
from app.models.client import Client
from app.models.merchant import Merchant
from app.schemas.clients import ClientCreate, ClientOut
from app.models.user import User
from app.schemas.clients import ClientUpdate

router = APIRouter(prefix="/clients", tags=["Clients"])


def get_current_merchant(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Merchant:
    merchant = db.query(Merchant).filter(
        Merchant.owner_user_id == user.id
    ).first()

    if not merchant:
        raise HTTPException(status_code=403, detail="Merchant not found")

    return merchant


@router.get("/", response_model=List[ClientOut])
def list_clients(
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant),
):
    return (
        db.query(Client)
        .filter(Client.merchant_id == merchant.id)
        .all()
    )


@router.post("/", response_model=ClientOut)
def create_client(
    payload: ClientCreate,
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant),
):
    client = Client(
        **payload.dict(),
        merchant_id=merchant.id,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client

@router.put("/{client_id}", response_model=ClientOut)
def update_client(
    client_id: int,
    payload: ClientUpdate,
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant),
):
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.merchant_id == merchant.id
    ).first()

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    for key, value in payload.dict(exclude_unset=True).items():
        setattr(client, key, value)

    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}")
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant),
):
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.merchant_id == merchant.id
    ).first()

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    db.delete(client)
    db.commit()
    return {"ok": True}