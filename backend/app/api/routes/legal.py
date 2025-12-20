from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.models.legal_document import LegalDocument
from app.models.legal_acceptance import LegalDocType

router = APIRouter(prefix="/legal", tags=["legal"])


def _latest_published(db: Session, doc_type: LegalDocType, locale: str) -> LegalDocument | None:
    loc = (locale or "en")[:16]
    row = (
        db.query(LegalDocument)
        .filter(
            LegalDocument.doc_type == doc_type,
            LegalDocument.locale == loc,
            LegalDocument.is_published == True,  # noqa: E712
        )
        .order_by(desc(LegalDocument.published_at), desc(LegalDocument.id))
        .first()
    )
    if not row and loc != "en":
        row = (
            db.query(LegalDocument)
            .filter(
                LegalDocument.doc_type == doc_type,
                LegalDocument.locale == "en",
                LegalDocument.is_published == True,  # noqa: E712
            )
            .order_by(desc(LegalDocument.published_at), desc(LegalDocument.id))
            .first()
        )
    return row


@router.get("/current")
def get_current_doc(
    doc_type: LegalDocType,
    locale: str = "en",
    db: Session = Depends(get_db),
):
    row = _latest_published(db, doc_type, locale)
    if not row:
        raise HTTPException(status_code=404, detail="No published document")

    return {
        "doc_type": row.doc_type.value,
        "version": row.version,
        "locale": row.locale,
        "published_at": row.published_at.isoformat() if row.published_at else None,
        "content_md": row.content_md or "",
        "content_url": row.content_url or "",
    }


# ✅ alias for frontend-ul  (which calls /legal/public/terms?locale=ro)
@router.get("/public/{doc_type}")
def get_public_doc(
    doc_type: str,
    locale: str = "en",
    db: Session = Depends(get_db),
):
    try:
        dt = LegalDocType(doc_type)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid doc_type. Use terms|privacy")

    row = _latest_published(db, dt, locale)
    if not row:
        raise HTTPException(status_code=404, detail="No published document")

    return {
        "doc_type": row.doc_type.value,
        "version": row.version,
        "locale": row.locale,
        "published_at": row.published_at.isoformat() if row.published_at else None,
        "content_md": row.content_md or "",
        "content_url": row.content_url or "",
    }
