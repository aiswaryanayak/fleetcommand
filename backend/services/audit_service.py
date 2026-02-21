"""
Audit service – records all state-changing operations for traceability.
Every trip lifecycle action, vehicle change, and CRUD mutation is logged.
"""
import logging
from sqlalchemy.orm import Session
from models.audit_log import AuditLog

logger = logging.getLogger("fleet.audit")


# ── Canonical action constants ────────────────────────────────────────────────
class Actions:
    # Trip lifecycle
    CREATE_TRIP = "CREATE_TRIP"
    DISPATCH_TRIP = "DISPATCH_TRIP"
    COMPLETE_TRIP = "COMPLETE_TRIP"
    CANCEL_TRIP = "CANCEL_TRIP"

    # Vehicle
    CREATE_VEHICLE = "CREATE_VEHICLE"
    UPDATE_VEHICLE = "UPDATE_VEHICLE"
    RETIRE_VEHICLE = "RETIRE_VEHICLE"
    DELETE_VEHICLE = "DELETE_VEHICLE"

    # Driver
    CREATE_DRIVER = "CREATE_DRIVER"
    UPDATE_DRIVER = "UPDATE_DRIVER"
    DELETE_DRIVER = "DELETE_DRIVER"

    # Maintenance
    CREATE_MAINTENANCE = "CREATE_MAINTENANCE"
    UPDATE_MAINTENANCE = "UPDATE_MAINTENANCE"
    RESOLVE_MAINTENANCE = "RESOLVE_MAINTENANCE"
    DELETE_MAINTENANCE = "DELETE_MAINTENANCE"

    # Finance
    CREATE_FUEL_LOG = "CREATE_FUEL_LOG"
    DELETE_FUEL_LOG = "DELETE_FUEL_LOG"
    CREATE_EXPENSE = "CREATE_EXPENSE"
    DELETE_EXPENSE = "DELETE_EXPENSE"


def log_action(
    db: Session,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: int,
    details: str = None,
) -> AuditLog:
    """
    Record an audit entry. Uses flush() instead of commit()
    so the caller controls the transaction boundary.
    """
    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )
    db.add(entry)
    db.flush()  # Write to DB but don't commit — caller owns the transaction

    logger.info(
        "AUDIT | user=%d action=%s entity=%s:%d | %s",
        user_id, action, entity_type, entity_id, details or "",
    )
    return entry


def get_audit_logs(
    db: Session,
    entity_type: str = None,
    entity_id: int = None,
    action: str = None,
    user_id: int = None,
    limit: int = 100,
) -> list:
    """Query audit logs with optional filters."""
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    return query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
