from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api import api_router
import subprocess
import os


def run_migrations():
    """Run alembic migrations on startup"""
    try:
        print("Running database migrations...")
        result = subprocess.run(
            ["python", "-m", "alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        if result.returncode == 0:
            print("Migrations completed successfully!")
            print(result.stdout)
        else:
            print(f"Migration warning: {result.stderr}")
    except Exception as e:
        print(f"Migration error (non-fatal): {e}")


def create_app() -> FastAPI:
    # Run migrations before creating app
    run_migrations()
    
    app = FastAPI(title="ACONT API", version="0.1.0")

    # ✅ Static mount ( "static" folder  in backend root)
    app.mount("/static", StaticFiles(directory="static"), name="static")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)
    return app


app = create_app()
