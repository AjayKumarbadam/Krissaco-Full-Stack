from sqlalchemy import Column, Integer, String, Text, DateTime, func
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(100), nullable=True)
    action = Column(String(50), nullable=False)
    actor_username = Column(String(100), nullable=False)
    actor_name = Column(String(150), nullable=False)
    actor_role = Column(String(50), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
