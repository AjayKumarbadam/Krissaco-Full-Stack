from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.deps import require_roles
from app.common.models.user import User
from app.common.models.audit_log import AuditLog
from app.features.audit_logs.schema import AuditLogsResponse

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get(
    "",
    response_model=AuditLogsResponse,
    summary="Get complete historical audit logs (Auditor & Manager)",
)
def get_audit_logs(
    limit: int = Query(100, gt=0, le=500, description="Max logs to retrieve"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    current_user: User = Depends(require_roles(["Auditor", "Manager"])),
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))

    logs = query.order_by(desc(AuditLog.timestamp)).limit(limit).all()

    return AuditLogsResponse(
        count=len(logs),
        logs=logs,
    )
