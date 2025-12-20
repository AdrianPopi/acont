from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api import api_router


def create_app() -> FastAPI:
    app = FastAPI(title="ACONT API", version="0.1.0")

    # ✅ Static mount ( "static" folder  in backend root)
    app.mount("/static", StaticFiles(directory="static"), name="static")

    origins = settings.CORS_ORIGINS


    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
        "http://localhost:3000",
    ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)
    return app


app = create_app()
