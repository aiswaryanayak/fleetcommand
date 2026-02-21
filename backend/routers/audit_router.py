"""
Audit router – read-only access to the audit trail.
Fleet Manager and Financial Analyst can view audit logs.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from middleware import require_roles
from models.user import User
from services.audit_service import get_audit_logs

router = APIRouter(prefix="/api/audit", tags=["Audit Trail"])


class AuditLogOut(BaseModel):
    id: int
    user_id: int
    action: str
    entity_type: str
    entity_id: int
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


AUDIT_ROLES = ["fleet_manager", "financial_analyst"]


@router.get("/logs", response_model=List[AuditLogOut])
def list_audit_logs(
    entity_type: str = Query(None),
    entity_id: int = Query(None),
    action: str = Query(None),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_roles(AUDIT_ROLES)),
    db: Session = Depends(get_db),
):
    """Retrieve audit trail entries with optional filters."""
    return get_audit_logs(
        db,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        limit=limit,
    )
