

from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
import secrets, hashlib
import jwt
from app.core.config import settings
from passlib.context import CryptContext

pwd = CryptContext(
    schemes=["bcrypt_sha256"],  # ✅ safe 
    deprecated="auto",
)

def hash_password(p: str) -> str:
    return pwd.hash(p)

def verify_password(p: str, hashed: str) -> bool:
    return pwd.verify(p, hashed)
def _now() -> datetime:
    return datetime.now(timezone.utc)

def create_access_token(sub: str, role: str) -> str:
    now = _now()
    exp = now + timedelta(minutes=settings.ACCESS_TOKEN_MINUTES)
    payload = {"sub": sub, "role": role, "iss": settings.JWT_ISSUER, "exp": int(exp.timestamp())}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

def create_refresh_token() -> str:
    return secrets.token_urlsafe(48)

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"], issuer=settings.JWT_ISSUER)
