# app/core/config.py
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    # CORS
    CORS_ORIGINS: list[str] = []

    # Cookies
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: str | None = None

    # JWT
    JWT_ISSUER: str = os.getenv("JWT_ISSUER", "http://localhost:8000")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me")

    # Tokens
    ACCESS_TOKEN_MINUTES: int = int(os.getenv("ACCESS_TOKEN_MINUTES", "15"))
    REFRESH_TOKEN_DAYS: int = int(os.getenv("REFRESH_TOKEN_DAYS", "5"))

    # ✅ Legal versions (enterprise)
    LEGAL_TERMS_VERSION: str = os.getenv("LEGAL_TERMS_VERSION", "2025-12-17")
    LEGAL_PRIVACY_VERSION: str = os.getenv("LEGAL_PRIVACY_VERSION", "2025-12-17")

    # DB
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Stripe
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLISHABLE_KEY: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    
    # Stripe Price IDs
    STRIPE_PRICE_STARTER_MONTHLY: str = os.getenv("STRIPE_PRICE_STARTER_MONTHLY", "")
    STRIPE_PRICE_STARTER_YEARLY: str = os.getenv("STRIPE_PRICE_STARTER_YEARLY", "")
    STRIPE_PRICE_PRO_MONTHLY: str = os.getenv("STRIPE_PRICE_PRO_MONTHLY", "")
    STRIPE_PRICE_PRO_YEARLY: str = os.getenv("STRIPE_PRICE_PRO_YEARLY", "")
    STRIPE_PRICE_ENTERPRISE_MONTHLY: str = os.getenv("STRIPE_PRICE_ENTERPRISE_MONTHLY", "")
    STRIPE_PRICE_ENTERPRISE_YEARLY: str = os.getenv("STRIPE_PRICE_ENTERPRISE_YEARLY", "")

settings = Settings(
    CORS_ORIGINS=[o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()],
    COOKIE_SECURE=os.getenv("COOKIE_SECURE", "false").lower() == "true",
    COOKIE_SAMESITE=os.getenv("COOKIE_SAMESITE", "lax"),
    COOKIE_DOMAIN=os.getenv("COOKIE_DOMAIN") or None,
)

if not settings.DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing. Set it in backend/.env")
