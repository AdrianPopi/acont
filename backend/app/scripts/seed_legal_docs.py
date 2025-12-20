from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.core.config import settings
from app.models.legal_document import LegalDocument
from app.models.legal_acceptance import LegalDocType


def run():
    db: Session = SessionLocal()
    try:
        for doc_type, version in [
            (LegalDocType.terms, settings.LEGAL_TERMS_VERSION),
            (LegalDocType.privacy, settings.LEGAL_PRIVACY_VERSION),
        ]:
            exists = db.query(LegalDocument).filter(
                LegalDocument.doc_type == doc_type,
                LegalDocument.version == version,
                LegalDocument.locale == "en",
            ).first()
            if not exists:
                db.add(LegalDocument(
                    doc_type=doc_type,
                    version=version,
                    locale="en",
                    is_published=True,
                    published_at=datetime.now(timezone.utc),
                    content_md=f"# {doc_type.value}\n\nPlaceholder content.",
                    content_url="",
                ))
        db.commit()
        print("Seed OK")
    finally:
        db.close()


if __name__ == "__main__":
    run()
