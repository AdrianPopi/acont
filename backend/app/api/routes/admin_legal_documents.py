from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.config import settings
from app.models.user import User
from app.api.routes.deps import get_current_user
from app.models.legal_document import LegalDocument
from app.models.legal_acceptance import LegalDocType

from pydantic import BaseModel, Field

router = APIRouter(prefix="/admin/legal-documents", tags=["Admin Legal Documents"])

def require_platform_admin(user: User = Depends(get_current_user)) -> User:
    if user.role.value != "platform_admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return user

class PublishIn(BaseModel):
    doc_type: LegalDocType
    locale: str = Field(default="en", max_length=16)
    version: str = Field(min_length=1, max_length=64)
    content_md: str = ""
    content_url: str = ""

class UpdateIn(BaseModel):
    version: str | None = None
    locale: str | None = None
    content_md: str | None = None
    content_url: str | None = None
    is_published: bool | None = None

@router.get("")
def list_docs(
    doc_type: LegalDocType | None = None,
    locale: str | None = None,
    published: bool | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_platform_admin),
):
    q = db.query(LegalDocument)
    if doc_type:
        q = q.filter(LegalDocument.doc_type == doc_type)
    if locale:
        q = q.filter(LegalDocument.locale == locale)
    if published is not None:
        q = q.filter(LegalDocument.is_published == published)

    items = q.order_by(LegalDocument.published_at.desc(), LegalDocument.id.desc()).limit(200).all()
    return {
        "items": [
            {
                "id": d.id,
                "doc_type": d.doc_type.value,
                "version": d.version,
                "locale": d.locale,
                "is_published": d.is_published,
                "published_at": d.published_at.isoformat() if d.published_at else None,
            }
            for d in items
        ]
    }

@router.get("/{doc_id}")
def get_doc(
    doc_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_platform_admin),
):
    d = db.query(LegalDocument).filter(LegalDocument.id == doc_id).first()
    if not d:
        raise HTTPException(404, "Not found")
    return {
        "id": d.id,
        "doc_type": d.doc_type.value,
        "version": d.version,
        "locale": d.locale,
        "is_published": d.is_published,
        "published_at": d.published_at.isoformat() if d.published_at else None,
        "content_md": d.content_md,
        "content_url": d.content_url,
    }

@router.patch("/{doc_id}")
def update_doc(
    doc_id: int,
    payload: UpdateIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_platform_admin),
):
    d = db.query(LegalDocument).filter(LegalDocument.id == doc_id).first()
    if not d:
        raise HTTPException(404, "Not found")

    if payload.version is not None:
        d.version = payload.version
    if payload.locale is not None:
        d.locale = payload.locale[:16]
    if payload.content_md is not None:
        d.content_md = payload.content_md
    if payload.content_url is not None:
        d.content_url = payload.content_url
    if payload.is_published is not None:
        d.is_published = payload.is_published

    db.commit()
    return {"ok": True}

@router.post("/publish")
def publish_new_version(
    payload: PublishIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_platform_admin),
):
    loc = (payload.locale or "en")[:16]

    # 1) unpublish all current for same doc+locale
    db.query(LegalDocument).filter(
        LegalDocument.doc_type == payload.doc_type,
        LegalDocument.locale == loc,
        LegalDocument.is_published == True,  # noqa
    ).update({LegalDocument.is_published: False})

    # 2) create + publish new
    d = LegalDocument(
        doc_type=payload.doc_type,
        version=payload.version,
        locale=loc,
        is_published=True,
        published_at=datetime.now(timezone.utc),
        content_md=payload.content_md or "",
        content_url=payload.content_url or "",
    )
    db.add(d)
    db.commit()
    db.refresh(d)

    return {
        "ok": True,
        "id": d.id,
        "doc_type": d.doc_type.value,
        "version": d.version,
        "locale": d.locale,
    }
