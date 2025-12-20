import os

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password

from dotenv import load_dotenv
load_dotenv(".env")

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@acont.local")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")  # IMPORTANT: <= 72 chars (bcrypt limit)

if not ADMIN_PASSWORD:
    raise SystemExit("Setează ADMIN_PASSWORD (max 72 caractere).")

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == ADMIN_EMAIL).first()

    if not user:
        user = User(
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            role=UserRole.platform_admin,
            is_email_verified=True,
            is_active=True,
            first_name="Platform",
            last_name="Admin",
        )
        db.add(user)
    else:
        # upgrade / reset
        user.role = UserRole.platform_admin
        user.password_hash = hash_password(ADMIN_PASSWORD)
        user.is_active = True
        user.is_email_verified = True

    db.commit()
    print(f"OK: {ADMIN_EMAIL} este platform_admin")
finally:
    db.close()
