from sqlalchemy.orm import Session
from app.common.models.audit_log import AuditLog
from app.common.models.user import User


def record_audit_log(
    db: Session,
    transaction_id: str,
    action: str,
    user: User,
    details: str,
):
    log_entry = AuditLog(
        transaction_id=str(transaction_id),
        action=action,
        actor_username=user.username,
        actor_name=user.full_name,
        actor_role=user.role,
        details=details,
    )
    db.add(log_entry)
    db.commit()
