from sqlalchemy.exc import IntegrityError
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.api.routes.deps import get_current_user
from app.core.countries import COUNTRY_RULES
from app.core.countries import CountryCode
from app.models.legal_acceptance import LegalAcceptance, LegalDocType
from app.core.legal import get_current_legal_versions
from app.models.legal_document import LegalDocument
from app.core.email import send_welcome_email, send_forgot_password_email
from sqlalchemy import desc
from sqlalchemy.dialects.postgresql import insert as pg_insert
from fastapi import Request
from pydantic import BaseModel
import json
import secrets


from app.db.session import get_db
from app.schemas.auth import (
    LegalAcceptIn, LoginIn, AuthOut,
    MerchantSignupIn
)
from app.models.user import User, UserRole
from app.models.merchant import Merchant
from app.models.token import Token
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, hash_token
)
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


def _get_client_ip(request: Request) -> str:
    # proxy-friendly
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    xri = request.headers.get("x-real-ip")
    if xri:
        return xri.strip()
    if request.client:
        return request.client.host
    return ""


def _get_user_agent(request: Request) -> str:
    return (request.headers.get("user-agent") or "")[:512]

def _has_acceptance(db: Session, user_id: int, doc: LegalDocType, version: str) -> bool:
    return db.query(LegalAcceptance).filter(
        LegalAcceptance.user_id == user_id,
        LegalAcceptance.doc_type == doc,
        LegalAcceptance.version == version,
    ).first() is not None

def _needs_legal_update(db: Session, user_id: int) -> bool:
    v = get_current_legal_versions(db)
    ok_terms = _has_acceptance(db, user_id, LegalDocType.terms, v["terms_version"])
    ok_priv = _has_acceptance(db, user_id, LegalDocType.privacy, v["privacy_version"])
    return not (ok_terms and ok_priv)


def _record_current_acceptances(db: Session, user_id: int, request: Request):
    v = get_current_legal_versions(db)

    ip = _get_client_ip(request)
    ua = _get_user_agent(request)
   

    rows = [
        {
            "user_id": user_id,
            "doc_type": LegalDocType.terms,
            "version": v["terms_version"],
            "ip": ip,
            "user_agent": ua,
        },
        {
            "user_id": user_id,
            "doc_type": LegalDocType.privacy,
            "version": v["privacy_version"],
            "ip": ip,
            "user_agent": ua,
        },
    ]

    # ✅ Postgres UPSERT: if already exists , do nt insert again
    for r in rows:
        stmt = (
            pg_insert(LegalAcceptance)
            .values(**r)
            .on_conflict_do_nothing(constraint="uq_legal_acceptance")
        )
        db.execute(stmt)

def _latest_published_version(db: Session, doc_type: LegalDocType, locale: str) -> str | None:
    loc = (locale or "en")[:16]
    d = db.query(LegalDocument).filter(
        LegalDocument.doc_type == doc_type,
        LegalDocument.locale == loc,
        LegalDocument.is_published == True,  # noqa
    ).order_by(LegalDocument.published_at.desc(), LegalDocument.id.desc()).first()
    return d.version if d else None

@router.get("/legal-versions")
def legal_versions(locale: str = "en", db: Session = Depends(get_db)):
    terms_v = _latest_published_version(db, LegalDocType.terms, locale) or settings.LEGAL_TERMS_VERSION
    priv_v = _latest_published_version(db, LegalDocType.privacy, locale) or settings.LEGAL_PRIVACY_VERSION
    return {"terms_version": terms_v, "privacy_version": priv_v}

@router.get("/countries")
def list_countries():
    return {"countries": [c.value for c in CountryCode]}




REFRESH_COOKIE = "acont_refresh"
ACCESS_COOKIE = "acont_access"

def _cookie_common():
    common = dict(
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )
    if settings.COOKIE_DOMAIN:  # doar dacă e setat
        common["domain"] = settings.COOKIE_DOMAIN
    return common

def _set_access_cookie(res: Response, access_token: str):
    res.set_cookie(
        key=ACCESS_COOKIE,
        value=access_token,
        path="/",
        max_age=settings.ACCESS_TOKEN_MINUTES * 60,
        **_cookie_common(),
    )

def _set_refresh_cookie(res: Response, refresh_token: str):
    res.set_cookie(
        key=REFRESH_COOKIE,
        value=refresh_token,
        path="/",  # Changed from /auth to / for proxy compatibility
        max_age=settings.REFRESH_TOKEN_DAYS * 24 * 3600,
        **_cookie_common(),
    )

def _clear_cookies(res: Response):
    res.delete_cookie(key=ACCESS_COOKIE, domain=settings.COOKIE_DOMAIN, path="/")
    res.delete_cookie(key=REFRESH_COOKIE, domain=settings.COOKIE_DOMAIN, path="/")

@router.get("/me")
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    v = get_current_legal_versions(db)

    return {
        "id": user.id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "is_email_verified": user.is_email_verified,
        "needs_legal_update": _needs_legal_update(db, user.id),
        "legal_terms_version": v["terms_version"],
        "legal_privacy_version": v["privacy_version"],
    }



@router.post("/signup/merchant")
def signup_merchant(payload: MerchantSignupIn, request: Request, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(400, "Email already registered")

    # ✅ validate BOTH
    if not (payload.accept_terms and payload.accept_privacy):
        raise HTTPException(400, "You must accept Terms and Privacy Policy")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.merchant_admin,
        first_name=payload.first_name,
        last_name=payload.last_name,
        is_email_verified=False,
        is_active=True,
    )
    db.add(user)
    db.flush()

    rules = COUNTRY_RULES[payload.country_code]

    merchant = Merchant(
        owner_user_id=user.id,
        company_name=payload.company_name,
        country_code=payload.country_code.value,
        jurisdiction=payload.country_code.value,
        settings_json={
            "vat_presets": rules["vat_presets"],
            "retention_years": rules["retention_years"],
            "currency": rules["currency"],
            "closed_until_date": None,
        },
    )
    db.add(merchant)
    
    _record_current_acceptances(db, user.id, request)
    db.commit()
    
    # ✅ Send welcome email (async-friendly, non-blocking)
    try:
        # Determine language from country
        lang_map = {"BE": "fr", "NL": "nl", "FR": "fr", "RO": "ro"}
        language = lang_map.get(payload.country_code.value, "en")
        
        send_welcome_email(
            to_email=user.email,
            first_name=user.first_name,
            company_name=payload.company_name,
            language=language,
        )
    except Exception as e:
        # Don't fail signup if email fails
        import logging
        logging.error(f"Failed to send welcome email: {e}")
    
    return {"ok": True}




@router.post("/legal-accept")
def legal_accept(
    payload: LegalAcceptIn,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not (payload.accept_terms and payload.accept_privacy):
        raise HTTPException(400, "You must accept Terms and Privacy Policy")

    _record_current_acceptances(db, user.id, request)
    db.commit()

    return {
        "ok": True,
        "needs_legal_update": False,
    }




@router.post("/login", response_model=AuthOut)
def login(payload: LoginIn, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    if not user.is_active:
        raise HTTPException(403, "Inactive user")

    access = create_access_token(sub=user.email, role=user.role.value)

    # refresh token stored hashed in DB
    refresh = create_refresh_token()
    db.add(Token(
        user_id=user.id,
        kind="refresh",
        token_hash=hash_token(refresh),
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_DAYS),
        revoked=False,
    ))
    db.commit()

    # ✅ cookies for middleware + refresh
    _set_access_cookie(response, access)
    _set_refresh_cookie(response, refresh)

    # ✅ body for client (optional; poți să NU-l mai salvezi deloc în localStorage)
    return AuthOut(access_token=access, role=user.role.value)


@router.post("/refresh")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get(REFRESH_COOKIE)
    if not refresh_token:
        raise HTTPException(401, "Missing refresh cookie")

    tok = db.query(Token).filter(
        Token.kind == "refresh",
        Token.token_hash == hash_token(refresh_token),
        Token.revoked == False,  # noqa
    ).first()

    if not tok or tok.expires_at < datetime.utcnow():
        raise HTTPException(401, "Invalid refresh token")

    user = db.query(User).filter(User.id == tok.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(401, "User not found")

    # ✅ rotation
    tok.revoked = True
    new_refresh = create_refresh_token()
    db.add(Token(
        user_id=user.id,
        kind="refresh",
        token_hash=hash_token(new_refresh),
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_DAYS),
        revoked=False,
    ))
    db.commit()

    new_access = create_access_token(sub=user.email, role=user.role.value)

    _set_access_cookie(response, new_access)
    _set_refresh_cookie(response, new_refresh)

    return {"access_token": new_access, "token_type": "bearer", "role": user.role.value}


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get(REFRESH_COOKIE)
    if refresh_token:
        tok = db.query(Token).filter(
            Token.kind == "refresh",
            Token.token_hash == hash_token(refresh_token),
            Token.revoked == False,  # noqa
        ).first()
        if tok:
            tok.revoked = True
            db.commit()

    _clear_cookies(response)
    return {"ok": True}


# ==================== PASSWORD CHANGE ====================
class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/me/password")
def change_password(
    req: PasswordChangeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change user password"""
    from app.core.security import verify_password, hash_password
    
    # Verify current password
    if not verify_password(req.current_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Update password
    user.password_hash = hash_password(req.new_password)
    db.add(user)
    db.commit()
    
    return {"ok": True}


# ==================== USER DATA ====================
import json
from fastapi import Response as FastAPIResponse


@router.get("/me/data")
def download_user_data(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Download all user data as JSON"""
    merchant = db.query(Merchant).filter(Merchant.owner_user_id == user.id).first()
    
    data = {
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "created_at": str(user.created_at),
        }
    }
    
    if merchant:
        data["merchant"] = {
            "id": merchant.id,
            "company_name": merchant.company_name,
            "cui": merchant.cui,
        }
    
    return FastAPIResponse(
        content=json.dumps(data, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=my-data.json"}
    )


@router.delete("/me")
def delete_account(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete user account (marked for deletion, 30 day recovery period)"""
    import stripe
    from app.core.config import settings
    from app.models.subscription import Subscription
    
    # Cancel Stripe subscription if exists
    if user.role == UserRole.merchant_admin:
        merchant = db.query(Merchant).filter(Merchant.owner_user_id == user.id).first()
        if merchant and merchant.subscription:
            sub = merchant.subscription
            if sub.stripe_subscription_id and settings.STRIPE_SECRET_KEY:
                try:
                    stripe.api_key = settings.STRIPE_SECRET_KEY
                    # Cancel immediately
                    stripe.Subscription.cancel(sub.stripe_subscription_id)
                except Exception as e:
                    import logging
                    logging.error(f"Failed to cancel Stripe subscription: {e}")
    
    # Mark user as inactive
    user.is_active = False
    db.add(user)
    db.commit()
    
    return {"ok": True, "message": "Account marked for deletion"}


# ==================== FORGOT PASSWORD ====================
class ForgotPasswordRequest(BaseModel):
    email: str
    language: str = "en"


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Request a password reset email."""
    # Always return success to prevent email enumeration
    user = db.query(User).filter(User.email == req.email).first()
    
    if user:
        # Invalidate any existing reset tokens
        db.query(Token).filter(
            Token.user_id == user.id,
            Token.kind == "reset_password",
            Token.revoked == False,
        ).update({"revoked": True})
        
        # Create a new reset token
        reset_token = secrets.token_urlsafe(32)
        
        db.add(Token(
            user_id=user.id,
            kind="reset_password",
            token_hash=hash_token(reset_token),
            expires_at=datetime.utcnow() + timedelta(hours=1),
            revoked=False,
        ))
        db.commit()
        
        # Send reset email
        try:
            send_forgot_password_email(
                to_email=user.email,
                first_name=user.first_name or "User",
                reset_token=reset_token,
                language=req.language,
            )
        except Exception as e:
            import logging
            logging.error(f"Failed to send password reset email: {e}")
    
    # Always return success
    return {"ok": True, "message": "If the email exists, a reset link has been sent"}


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password with token."""
    # Find the token
    tok = db.query(Token).filter(
        Token.kind == "reset_password",
        Token.token_hash == hash_token(req.token),
        Token.revoked == False,
    ).first()
    
    if not tok or tok.expires_at < datetime.utcnow():
        raise HTTPException(400, "Invalid or expired reset token")
    
    # Get the user
    user = db.query(User).filter(User.id == tok.user_id).first()
    if not user:
        raise HTTPException(400, "User not found")
    
    # Update password
    user.password_hash = hash_password(req.new_password)
    
    # Revoke the token
    tok.revoked = True
    
    # Revoke all other reset tokens for this user
    db.query(Token).filter(
        Token.user_id == user.id,
        Token.kind == "reset_password",
        Token.revoked == False,
    ).update({"revoked": True})
    
    db.commit()
    
    return {"ok": True, "message": "Password has been reset successfully"}
