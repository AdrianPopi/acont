# app/core/legal.py
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.config import settings
from app.models.legal_document import LegalDocument
from app.models.legal_acceptance import LegalDocType


def get_current_legal_versions(db: Session, locale: str | None = None) -> dict:
    loc = (locale or "en")[:16]

    def latest(doc_type: LegalDocType) -> str | None:
        row = (
            db.query(LegalDocument)
            .filter(
                LegalDocument.doc_type == doc_type,
                LegalDocument.is_published == True,  # noqa
                LegalDocument.locale == loc,
            )
            .order_by(desc(LegalDocument.published_at), desc(LegalDocument.id))
            .first()
        )
        return row.version if row else None

    terms = latest(LegalDocType.terms) or settings.LEGAL_TERMS_VERSION
    priv = latest(LegalDocType.privacy) or settings.LEGAL_PRIVACY_VERSION

    return {"terms_version": terms, "privacy_version": priv, "locale": loc}
