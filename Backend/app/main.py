from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine
from app.features.auth import router as auth_router
from app.features.latest_transactions import router as latest_transactions_router
from app.features.record_transaction import router as record_transaction_router
from app.features.statement import router as statement_router
from app.features.audit_logs import router as audit_logs_router

# Ensure SQLAlchemy model discovery
import app.common.models.transaction
import app.common.models.user
import app.common.models.audit_log

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Krissaco Enterprise Financial Transaction & Audit Management Platform",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "version": settings.VERSION}


# Register feature routers
app.include_router(auth_router.router)
app.include_router(record_transaction_router.router)
app.include_router(latest_transactions_router.router)
app.include_router(statement_router.router)
app.include_router(audit_logs_router.router)