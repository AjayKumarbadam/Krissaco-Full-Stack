from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transaction_id: Optional[str] = None
    action: str
    actor_username: str
    actor_name: str
    actor_role: str
    details: Optional[str] = None
    timestamp: datetime


class AuditLogsResponse(BaseModel):
    count: int
    logs: List[AuditLogOut]
