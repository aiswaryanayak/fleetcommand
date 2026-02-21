"""
Driver service – business logic for driver management and safety scoring.
Enforces:
  - License expiry blocking
  - Safety score auto-calculation
  - Completion rate tracking
"""
from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.driver import Driver, DriverStatus
from schemas.driver import DriverCreate, DriverUpdate


def get_all_drivers(db: Session, status_filter: str = None, search: str = None):
    """Retrieve all drivers with optional filters."""
    query = db.query(Driver)
    if status_filter:
        query = query.filter(Driver.status == status_filter)
    if search:
        query = query.filter(
            (Driver.full_name.ilike(f"%{search}%")) |
            (Driver.license_number.ilike(f"%{search}%"))
        )
    return query.order_by(Driver.id.desc()).all()


def get_driver_by_id(db: Session, driver_id: int) -> Driver:
    """Get a single driver or raise 404."""
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found")
    return driver


def create_driver(db: Session, data: DriverCreate) -> Driver:
    """Create a new driver. License number must be unique."""
    existing = db.query(Driver).filter(Driver.license_number == data.license_number).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"License number '{data.license_number}' already registered")

    driver = Driver(**data.model_dump())
    db.add(driver)
    db.flush()
    return driver


def update_driver(db: Session, driver_id: int, data: DriverUpdate) -> Driver:
    """Update driver fields."""
    driver = get_driver_by_id(db, driver_id)
    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(driver, key, value)

    db.flush()
    return driver


def delete_driver(db: Session, driver_id: int):
    """Delete a driver if they have no active trips."""
    from models.trip import Trip
    driver = get_driver_by_id(db, driver_id)

    active = db.query(Trip).filter(
        Trip.driver_id == driver_id,
        Trip.status.in_(["Draft", "Dispatched"])
    ).count()

    if active > 0:
        raise HTTPException(status_code=400, detail="Cannot delete driver with active trips")

    db.delete(driver)
    db.flush()
    return {"detail": "Driver deleted", "id": driver_id}


def is_license_expired(driver: Driver) -> bool:
    """Check if driver's license is expired."""
    return driver.license_expiry < date.today()


def recalculate_driver_stats(db: Session, driver: Driver):
    """
    Recalculate completion rate and safety score after a trip event.
    Safety score formula: 100 - (complaints * 5) - (cancellation_rate * 20)
    """
    from models.trip import Trip
    total = db.query(Trip).filter(Trip.driver_id == driver.id).count()
    completed = db.query(Trip).filter(
        Trip.driver_id == driver.id, Trip.status == "Completed"
    ).count()
    cancelled = db.query(Trip).filter(
        Trip.driver_id == driver.id, Trip.status == "Cancelled"
    ).count()

    driver.total_trips = total
    driver.completed_trips = completed
    driver.completion_rate = round((completed / total * 100) if total > 0 else 0, 2)

    cancellation_rate = (cancelled / total) if total > 0 else 0
    safety = 100 - (driver.complaints * 5) - (cancellation_rate * 20)
    driver.safety_score = round(max(0, min(100, safety)), 2)

    # flush only — caller owns the transaction boundary
    db.flush()


def enrich_driver(driver: Driver) -> dict:
    """Add computed fields to driver output."""
    result = {
        "id": driver.id,
        "full_name": driver.full_name,
        "license_number": driver.license_number,
        "license_expiry": driver.license_expiry,
        "phone": driver.phone,
        "safety_score": driver.safety_score,
        "completion_rate": driver.completion_rate,
        "total_trips": driver.total_trips,
        "completed_trips": driver.completed_trips,
        "complaints": driver.complaints,
        "status": driver.status,
        "created_at": driver.created_at,
        "license_expired": is_license_expired(driver),
    }
    return result
