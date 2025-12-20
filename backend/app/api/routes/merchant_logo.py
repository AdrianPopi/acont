# app/api/routes/merchant_logo.py
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.routes.deps import require_role
from app.models.user import User, UserRole
from app.models.merchant import Merchant

router = APIRouter(prefix="/merchants", tags=["Merchants"])

LOGOS_DIR = Path("static/logos")
LOGOS_DIR.mkdir(parents=True, exist_ok=True)

def get_current_merchant(
    user: User = Depends(require_role(UserRole.merchant_admin)),
    db: Session = Depends(get_db),
) -> Merchant:
    m = db.query(Merchant).filter(Merchant.owner_user_id == user.id).first()
    if not m:
        raise HTTPException(status_code=403, detail="Merchant not found for this user")
    return m

@router.post("/me/logo")
async def upload_my_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant),
):
    if file.content_type not in ("image/png", "image/jpeg"):
        raise HTTPException(status_code=400, detail="Only PNG or JPEG allowed")

    data = await file.read()
    if len(data) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Max 2MB")

    ext = ".png" if file.content_type == "image/png" else ".jpg"
    out_path = LOGOS_DIR / f"merchant_{merchant.id}{ext}"
    out_path.write_bytes(data)

    merchant.logo_url = f"/static/logos/merchant_{merchant.id}{ext}"
    db.add(merchant)
    db.commit()
    db.refresh(merchant)

    return {"logo_url": merchant.logo_url}

@router.get("/me")
def get_my_merchant(merchant: Merchant = Depends(get_current_merchant)):
    return {"id": merchant.id, "company_name": merchant.company_name, "logo_url": merchant.logo_url}
