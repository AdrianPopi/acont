from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.api.routes.clients import get_current_merchant
from app.models.product import Product
from app.schemas.products import ProductCreate, ProductOut, ProductUpdate
from app.models.merchant import Merchant

from fastapi import UploadFile, File
from decimal import Decimal, InvalidOperation
import csv
import io


router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/", response_model=List[ProductOut])
def list_products(
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant),
):
    return db.query(Product).filter(
        Product.merchant_id == merchant.id
    ).all()

@router.post("/", response_model=ProductOut)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant),
):
    product = Product(
        **payload.dict(),
        merchant_id=merchant.id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant),
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.merchant_id == merchant.id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for k, v in payload.dict(exclude_unset=True).items():
        setattr(product, k, v)

    db.commit()
    db.refresh(product)
    return product


@router.post("/upload-csv")
async def upload_products_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant),
):
    # Acceptă doar CSV
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")  # suportă UTF-8 + BOM
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid CSV encoding (use UTF-8)")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV must include a header row")

    # Coloane acceptate (nu te obligă să le ai pe toate)
    # Recomandat: name, unit_price sunt obligatorii pe fiecare rând
    required_cols = {"name", "unit_price"}
    missing_required = required_cols - set([c.strip() for c in reader.fieldnames])
    if missing_required:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(sorted(missing_required))}",
        )

    def parse_decimal(val: str, default: Decimal | None = None) -> Decimal | None:
        if val is None:
            return default
        s = str(val).strip()
        if s == "":
            return default
        # acceptă și 12,34
        s = s.replace(",", ".")
        try:
            return Decimal(s)
        except (InvalidOperation, ValueError):
            return None

    created = 0
    updated = 0
    errors = []

    # opțional: limite ca să nu bage cineva 200k rânduri
    MAX_ROWS = 5000
    row_index = 1  # 1-based pentru user (după header)

    for row in reader:
        row_index += 1
        if row_index > MAX_ROWS + 1:
            errors.append({"row": row_index, "error": f"Too many rows (max {MAX_ROWS})"})
            break

        name = (row.get("name") or "").strip()
        code = (row.get("code") or "").strip() or None
        description = (row.get("description") or "").strip() or None

        unit_price = parse_decimal(row.get("unit_price"))
        vat_rate = parse_decimal(row.get("vat_rate"), default=Decimal("0"))

        if not name:
            errors.append({"row": row_index, "error": "name is required"})
            continue
        if unit_price is None:
            errors.append({"row": row_index, "error": "unit_price must be a number"})
            continue
        if vat_rate is None:
            errors.append({"row": row_index, "error": "vat_rate must be a number"})
            continue

        # Decide: update dacă există deja același code la merchant (dacă ai code)
        existing = None
        if code:
            existing = db.query(Product).filter(
                Product.merchant_id == merchant.id,
                Product.code == code
            ).first()

        if existing:
            existing.name = name
            existing.description = description
            existing.unit_price = unit_price
            existing.vat_rate = vat_rate
            updated += 1
        else:
            p = Product(
                merchant_id=merchant.id,
                name=name,
                code=code,
                description=description,
                unit_price=unit_price,
                vat_rate=vat_rate,
            )
            db.add(p)
            created += 1

    db.commit()

    return {
        "ok": True,
        "created": created,
        "updated": updated,
        "failed": len(errors),
        "errors": errors[:50],  # nu trimite 5000 erori în response
    }




@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant),
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.merchant_id == merchant.id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return {"ok": True}
