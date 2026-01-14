from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.admin_legal_documents import router as admin_legal_docs_router
from app.api.routes.legal import router as legal_public_router
from app.api.routes.invoices import router as invoices_router
from app.api.routes.merchant_logo import router as merchant_logo_router
from app.api.routes.clients import router as clients_router
from app.api.routes.products import router as products_router 
from app.api.routes.credit_notes import router as credit_notes_router
from app.api.routes.calendar import router as calendar_router
from app.api.routes.help import router as help_router
from app.api.routes.health import router as health_router
from app.api.routes.preferences import router as preferences_router
from app.api.routes.reports import router as reports_router
from app.api.routes.suppliers import router as suppliers_router
from app.api.routes.subscriptions import router as subscriptions_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(health_router)
api_router.include_router(admin_legal_docs_router)
api_router.include_router(legal_public_router)
api_router.include_router(invoices_router)
api_router.include_router(merchant_logo_router)
api_router.include_router(clients_router)
api_router.include_router(products_router) 
api_router.include_router(credit_notes_router)
api_router.include_router(calendar_router)
api_router.include_router(help_router)
api_router.include_router(preferences_router)
api_router.include_router(reports_router, prefix="/reports", tags=["reports"])
api_router.include_router(suppliers_router)
api_router.include_router(subscriptions_router)