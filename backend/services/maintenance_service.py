from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.maintenance import MaintenanceLog, MaintenanceStatus
from models.vehicle import Vehicle, VehicleStatus
from schemas.maintenance import MaintenanceLogCreate, MaintenanceLogUpdate


def get_all_logs(db: Session, vehicle_id: int = None, status_filter: str = None):
    """Retrieve all maintenance logs with optional filters."""
    query = db.query(MaintenanceLog)
    if vehicle_id:
        query = query.filter(MaintenanceLog.vehicle_id == vehicle_id)
    if status_filter:
        query = query.filter(MaintenanceLog.status == status_filter)
    return query.order_by(MaintenanceLog.id.desc()).all()


def get_log_by_id(db: Session, log_id: int) -> MaintenanceLog:
    """Get a single maintenance log or raise 404."""
    log = db.query(MaintenanceLog).filter(MaintenanceLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Maintenance log not found")
    return log


def create_log(db: Session, data: MaintenanceLogCreate) -> MaintenanceLog:
    """
    Create a maintenance log and automatically set vehicle to "In Shop".
    Vehicle must not be on a trip.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    if vehicle.status == VehicleStatus.ON_TRIP.value:
        raise HTTPException(status_code=400, detail="Cannot create maintenance log for a vehicle on trip")

    if vehicle.status == VehicleStatus.RETIRED.value:
        raise HTTPException(status_code=400, detail="Cannot create maintenance log for a retired vehicle")

    log = MaintenanceLog(**data.model_dump())
    db.add(log)
    vehicle.status = VehicleStatus.IN_SHOP.value
    db.flush()
    return log


def update_log(db: Session, log_id: int, data: MaintenanceLogUpdate) -> MaintenanceLog:
    """
    Update maintenance log. If status changes to "Resolved",
    check if vehicle has other open logs before setting back to "Available".
    """
    log = get_log_by_id(db, log_id)
    update_data = data.model_dump(exclude_unset=True)

    old_status = log.status

    for key, value in update_data.items():
        setattr(log, key, value)

    # If resolving the log, potentially release the vehicle
    if "status" in update_data and update_data["status"] == MaintenanceStatus.RESOLVED.value:
        if old_status != MaintenanceStatus.RESOLVED.value:
            vehicle = db.query(Vehicle).filter(Vehicle.id == log.vehicle_id).first()
            # Check if there are other unresolved logs
            open_count = db.query(MaintenanceLog).filter(
                MaintenanceLog.vehicle_id == log.vehicle_id,
                MaintenanceLog.id != log.id,
                MaintenanceLog.status != MaintenanceStatus.RESOLVED.value,
            ).count()
            if open_count == 0 and vehicle.status == VehicleStatus.IN_SHOP.value:
                vehicle.status = VehicleStatus.AVAILABLE.value

    db.flush()
    return log


def delete_log(db: Session, log_id: int):
    """Delete a maintenance log."""
    log = get_log_by_id(db, log_id)
    vehicle_id = log.vehicle_id
    db.delete(log)

    # Check if vehicle should be released
    open_count = db.query(MaintenanceLog).filter(
        MaintenanceLog.vehicle_id == vehicle_id,
        MaintenanceLog.status != MaintenanceStatus.RESOLVED.value,
    ).count()
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if open_count == 0 and vehicle and vehicle.status == VehicleStatus.IN_SHOP.value:
        vehicle.status = VehicleStatus.AVAILABLE.value

    db.flush()
    return {"detail": "Maintenance log deleted", "id": log_id}


def enrich_log(db: Session, log: MaintenanceLog) -> dict:
    """Add vehicle name to maintenance log output."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == log.vehicle_id).first()
    return {
        "id": log.id,
        "vehicle_id": log.vehicle_id,
        "issue": log.issue,
        "description": log.description,
        "date": log.date,
        "cost": log.cost,
        "status": log.status,
        "created_at": log.created_at,
        "vehicle_name": vehicle.name if vehicle else None,
    }
