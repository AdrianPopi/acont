from logging.config import fileConfig
from alembic import context
from sqlalchemy import engine_from_config, pool
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from app.models import invoice, invoice_item, invoice_sequence  # noqa: F401


# Root = backend/
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

# load .env from backend/.env
load_dotenv(ROOT / ".env")

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

db_url = os.getenv("DATABASE_URL")
if not db_url:
    raise RuntimeError("DATABASE_URL is not set in .env")

config.set_main_option("sqlalchemy.url", db_url)

# ✅ Import Base + models AFTER sys.path
from app.db.base import Base  # noqa: E402
from app.models import user, merchant, link, audit, token, legal_acceptance, legal_document  # noqa: F401,E402

target_metadata = Base.metadata


def run_migrations_offline():
    context.configure(
        url=db_url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
