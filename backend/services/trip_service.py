import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException
from models.trip import Trip, TripStatus
from models.vehicle import Vehicle, VehicleStatus
from models.driver import Driver, DriverStatus
from schemas.trip import TripCreate, TripUpdate, TripComplete
from services.driver_service import is_license_expired, recalculate_driver_stats
from services.audit_service import log_action, Actions

logger = logging.getLogger("fleet.trips")


def get_all_trips(db: Session, status_filter: str = None, search: str = None):
    """Retrieve all trips with optional filters, joined with vehicle/driver names."""
    query = db.query(Trip)
    if status_filter:
        query = query.filter(Trip.status == status_filter)
    if search:
        query = query.filter(
            (Trip.origin.ilike(f"%{search}%")) |
            (Trip.destination.ilike(f"%{search}%"))
        )
    trips = query.order_by(Trip.id.desc()).all()
    return trips


def get_trip_by_id(db: Session, trip_id: int) -> Trip:
    """Get a single trip or raise 404."""
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


def create_trip(db: Session, data: TripCreate) -> Trip:
    """
    Create a trip in DRAFT status.
    Validates vehicle capacity and driver eligibility but does NOT
    change vehicle/driver status until dispatch.
    """
    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    driver = db.query(Driver).filter(Driver.id == data.driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    if data.cargo_weight > vehicle.max_capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Cargo weight ({data.cargo_weight}kg) exceeds vehicle capacity ({vehicle.max_capacity}kg)"
        )

    if is_license_expired(driver):
        raise HTTPException(
            status_code=400,
            detail=f"Driver '{driver.full_name}' has an expired license (expired {driver.license_expiry})"
        )

    if driver.status != DriverStatus.ON_DUTY.value:
        raise HTTPException(
            status_code=400,
            detail=f"Driver '{driver.full_name}' is not On Duty (current: {driver.status})"
        )

    if vehicle.status != VehicleStatus.AVAILABLE.value:
        raise HTTPException(
            status_code=400,
            detail=f"Vehicle '{vehicle.name}' is not Available (current: {vehicle.status})"
        )

    active_vehicle_trip = db.query(Trip).filter(
        Trip.vehicle_id == data.vehicle_id,
        Trip.status.in_([TripStatus.DISPATCHED.value])
    ).first()
    if active_vehicle_trip:
        raise HTTPException(status_code=400, detail="Vehicle is already assigned to an active trip")

    active_driver_trip = db.query(Trip).filter(
        Trip.driver_id == data.driver_id,
        Trip.status.in_([TripStatus.DISPATCHED.value])
    ).first()
    if active_driver_trip:
        raise HTTPException(status_code=400, detail="Driver is already assigned to an active trip")

    trip = Trip(**data.model_dump())
    trip.status = TripStatus.DRAFT.value
    db.add(trip)
    db.flush()  # get trip.id for audit log

    logger.info("Trip created: id=%d vehicle=%d driver=%d cargo=%.0fkg",
                trip.id, trip.vehicle_id, trip.driver_id, trip.cargo_weight)
    return trip


def dispatch_trip(db: Session, trip_id: int) -> Trip:
    """
    Transition trip from Draft → Dispatched.
    ATOMIC: sets vehicle to "On Trip" and driver to "On Trip".
    """
    trip = get_trip_by_id(db, trip_id)

    if trip.status != TripStatus.DRAFT.value:
        raise HTTPException(status_code=400, detail=f"Can only dispatch trips in Draft status (current: {trip.status})")

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    # Re-validate at dispatch time
    if vehicle.status != VehicleStatus.AVAILABLE.value:
        raise HTTPException(status_code=400, detail=f"Vehicle is no longer available (current: {vehicle.status})")

    if is_license_expired(driver):
        raise HTTPException(status_code=400, detail="Driver's license has expired since trip creation")

    if driver.status != DriverStatus.ON_DUTY.value:
        raise HTTPException(status_code=400, detail=f"Driver is not On Duty (current: {driver.status})")

    trip.status = TripStatus.DISPATCHED.value
    vehicle.status = VehicleStatus.ON_TRIP.value
    driver.status = DriverStatus.ON_TRIP.value

    db.flush()  # write — single commit happens in router

    logger.info("Trip dispatched: id=%d vehicle=%s→On Trip driver=%s→On Trip",
                trip.id, vehicle.name, driver.full_name)
    return trip


def complete_trip(db: Session, trip_id: int, data: TripComplete) -> Trip:
    """
    Transition trip from Dispatched → Completed.
    ATOMIC: resets vehicle to "Available", driver to "On Duty",
    updates odometer, recalculates driver stats.
    """
    trip = get_trip_by_id(db, trip_id)

    if trip.status != TripStatus.DISPATCHED.value:
        raise HTTPException(status_code=400, detail=f"Can only complete trips in Dispatched status (current: {trip.status})")

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    trip.status = TripStatus.COMPLETED.value
    trip.distance = data.distance
    if data.revenue is not None:
        trip.revenue = data.revenue
    trip.completed_date = datetime.now(timezone.utc)

    vehicle.status = VehicleStatus.AVAILABLE.value
    vehicle.odometer += data.distance  # Update odometer

    driver.status = DriverStatus.ON_DUTY.value

    # Recalculate driver stats (uses flush internally)
    recalculate_driver_stats(db, driver)

    db.flush()  # write all changes — single commit happens in router

    logger.info("Trip completed: id=%d distance=%.1fkm revenue=%.2f",
                trip.id, data.distance, trip.revenue)
    return trip


def cancel_trip(db: Session, trip_id: int) -> Trip:
    """
    Cancel a trip (Draft or Dispatched).
    If dispatched, resets vehicle and driver status.
    """
    trip = get_trip_by_id(db, trip_id)

    if trip.status not in [TripStatus.DRAFT.value, TripStatus.DISPATCHED.value]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel a trip with status '{trip.status}'")

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    # If dispatched, reverse status changes
    was_dispatched = trip.status == TripStatus.DISPATCHED.value
    if was_dispatched:
        vehicle.status = VehicleStatus.AVAILABLE.value
        driver.status = DriverStatus.ON_DUTY.value

    trip.status = TripStatus.CANCELLED.value

    # Recalculate driver stats (uses flush internally)
    recalculate_driver_stats(db, driver)

    db.flush()  # write all changes — single commit happens in router

    logger.info("Trip cancelled: id=%d was_dispatched=%s",
                trip.id, was_dispatched)
    return trip


def enrich_trip(db: Session, trip: Trip) -> dict:
    """Add joined vehicle/driver names to trip output."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
    return {
        "id": trip.id,
        "vehicle_id": trip.vehicle_id,
        "driver_id": trip.driver_id,
        "cargo_weight": trip.cargo_weight,
        "origin": trip.origin,
        "destination": trip.destination,
        "distance": trip.distance,
        "estimated_fuel_cost": trip.estimated_fuel_cost,
        "revenue": trip.revenue,
        "status": trip.status,
        "scheduled_date": trip.scheduled_date,
        "completed_date": trip.completed_date,
        "created_at": trip.created_at,
        "vehicle_name": vehicle.name if vehicle else None,
        "driver_name": driver.full_name if driver else None,
    }
