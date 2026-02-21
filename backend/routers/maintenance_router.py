"""
Maintenance router – service log CRUD with RBAC and audit logging.
Fleet Manager: full CRUD
Financial Analyst: read-only
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from middleware import require_roles
from models.user import User
from schemas.maintenance import MaintenanceLogCreate, MaintenanceLogUpdate, MaintenanceLogOut
from services.maintenance_service import (
    get_all_logs, get_log_by_id, create_log,
    update_log, delete_log, enrich_log,
)
from services.audit_service import log_action, Actions

router = APIRouter(prefix="/api/maintenance", tags=["Maintenance"])

READ_ROLES = ["fleet_manager", "financial_analyst"]
WRITE_ROLES = ["fleet_manager"]


@router.get("/", response_model=List[MaintenanceLogOut])
def list_logs(
    vehicle_id: int = Query(None),
    status: str = Query(None),
    current_user: User = Depends(require_roles(READ_ROLES)),
    db: Session = Depends(get_db),
):
    logs = get_all_logs(db, vehicle_id=vehicle_id, status_filter=status)
    return [enrich_log(db, l) for l in logs]


@router.get("/{log_id}", response_model=MaintenanceLogOut)
def get_log(
    log_id: int,
    current_user: User = Depends(require_roles(READ_ROLES)),
    db: Session = Depends(get_db),
):
    log = get_log_by_id(db, log_id)
    return enrich_log(db, log)


@router.post("/", response_model=MaintenanceLogOut, status_code=201)
def add_log(
    data: MaintenanceLogCreate,
    current_user: User = Depends(require_roles(WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    """Create maintenance log → vehicle automatically set to 'In Shop'."""
    log = create_log(db, data)
    log_action(db, current_user.id, Actions.CREATE_MAINTENANCE, "maintenance", log.id,
               f"Created maintenance log for vehicle #{log.vehicle_id}: {log.issue}")
    db.commit()
    db.refresh(log)
    return enrich_log(db, log)


@router.put("/{log_id}", response_model=MaintenanceLogOut)
def edit_log(
    log_id: int,
    data: MaintenanceLogUpdate,
    current_user: User = Depends(require_roles(WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    """Update log. Resolving releases vehicle if no other open logs."""
    old_log = get_log_by_id(db, log_id)
    old_status = old_log.status
    log = update_log(db, log_id, data)
    action = Actions.RESOLVE_MAINTENANCE if log.status == "Resolved" and old_status != "Resolved" else Actions.UPDATE_MAINTENANCE
    log_action(db, current_user.id, action, "maintenance", log.id,
               f"{'Resolved' if action == Actions.RESOLVE_MAINTENANCE else 'Updated'} maintenance log #{log.id}")
    db.commit()
    db.refresh(log)
    return enrich_log(db, log)


@router.delete("/{log_id}")
def remove_log(
    log_id: int,
    current_user: User = Depends(require_roles(WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    result = delete_log(db, log_id)
    log_action(db, current_user.id, Actions.DELETE_MAINTENANCE, "maintenance", log_id,
               f"Deleted maintenance log #{log_id}")
    db.commit()
    return result
