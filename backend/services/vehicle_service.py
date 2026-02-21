"""
Vehicle service – business logic for vehicle CRUD and lifecycle.
Enforces:
  - Unique license plate constraint
  - Status transition rules
  - Prevents modification of retired vehicles
"""
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from fastapi import HTTPException, status
from models.vehicle import Vehicle, VehicleStatus
from models.trip import Trip
from models.fuel_log import FuelLog
from models.maintenance import MaintenanceLog
from models.expense import Expense
from schemas.vehicle import VehicleCreate, VehicleUpdate


def get_all_vehicles(db: Session, vehicle_type: str = None, status_filter: str = None, region: str = None, search: str = None):
    """Retrieve all vehicles with optional filters."""
    query = db.query(Vehicle)
    if vehicle_type:
        query = query.filter(Vehicle.vehicle_type == vehicle_type)
    if status_filter:
        query = query.filter(Vehicle.status == status_filter)
    if region:
        query = query.filter(Vehicle.region == region)
    if search:
        query = query.filter(
            (Vehicle.name.ilike(f"%{search}%")) |
            (Vehicle.license_plate.ilike(f"%{search}%")) |
            (Vehicle.model.ilike(f"%{search}%"))
        )
    return query.order_by(Vehicle.id.desc()).all()


def get_vehicle_by_id(db: Session, vehicle_id: int) -> Vehicle:
    """Get a single vehicle or raise 404."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    return vehicle


def create_vehicle(db: Session, data: VehicleCreate) -> Vehicle:
    """Create a new vehicle. Enforces unique license plate."""
    # Check unique license plate
    existing = db.query(Vehicle).filter(Vehicle.license_plate == data.license_plate).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"License plate '{data.license_plate}' already registered"
        )
    # Validate vehicle type
    valid_types = ["Truck", "Van", "Bike"]
    if data.vehicle_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Vehicle type must be one of: {valid_types}")

    vehicle = Vehicle(**data.model_dump())
    db.add(vehicle)
    db.flush()
    return vehicle


def update_vehicle(db: Session, vehicle_id: int, data: VehicleUpdate) -> Vehicle:
    """Update vehicle fields. Cannot modify retired vehicles."""
    vehicle = get_vehicle_by_id(db, vehicle_id)

    if vehicle.status == VehicleStatus.RETIRED.value and (data.status is None or data.status == VehicleStatus.RETIRED.value):
        raise HTTPException(status_code=400, detail="Cannot modify a retired vehicle")

    update_data = data.model_dump(exclude_unset=True)

    # Validate status transition
    if "status" in update_data:
        _validate_status_transition(vehicle.status, update_data["status"])

    for key, value in update_data.items():
        setattr(vehicle, key, value)

    db.flush()
    return vehicle


def retire_vehicle(db: Session, vehicle_id: int) -> Vehicle:
    """Retire a vehicle. Cannot retire if on trip."""
    vehicle = get_vehicle_by_id(db, vehicle_id)
    if vehicle.status == VehicleStatus.ON_TRIP.value:
        raise HTTPException(status_code=400, detail="Cannot retire a vehicle that is currently on a trip")
    if vehicle.status == VehicleStatus.RETIRED.value:
        raise HTTPException(status_code=400, detail="Vehicle is already retired")
    vehicle.status = VehicleStatus.RETIRED.value
    db.flush()
    return vehicle


def delete_vehicle(db: Session, vehicle_id: int):
    """Delete a vehicle (soft-delete by retiring, or hard delete if no trips)."""
    vehicle = get_vehicle_by_id(db, vehicle_id)
    trip_count = db.query(Trip).filter(Trip.vehicle_id == vehicle_id).count()
    if trip_count > 0:
        # Soft delete – retire instead
        vehicle.status = VehicleStatus.RETIRED.value
        db.flush()
        return {"detail": "Vehicle retired (has trip history)", "id": vehicle_id}
    db.delete(vehicle)
    db.flush()
    return {"detail": "Vehicle deleted", "id": vehicle_id}


def enrich_vehicle(db: Session, vehicle: Vehicle) -> dict:
    """Add computed financial fields to a vehicle."""
    fuel_cost = db.query(sql_func.coalesce(sql_func.sum(FuelLog.cost), 0.0)).filter(
        FuelLog.vehicle_id == vehicle.id
    ).scalar()
    maint_cost = db.query(sql_func.coalesce(sql_func.sum(MaintenanceLog.cost), 0.0)).filter(
        MaintenanceLog.vehicle_id == vehicle.id
    ).scalar()
    revenue = db.query(sql_func.coalesce(sql_func.sum(Trip.revenue), 0.0)).filter(
        Trip.vehicle_id == vehicle.id, Trip.status == "Completed"
    ).scalar()
    expense_cost = db.query(sql_func.coalesce(sql_func.sum(Expense.amount), 0.0)).filter(
        Expense.vehicle_id == vehicle.id
    ).scalar()

    total_cost = float(fuel_cost) + float(maint_cost) + float(expense_cost)
    acq = vehicle.acquisition_cost if vehicle.acquisition_cost > 0 else 1
    roi = (float(revenue) - total_cost) / acq

    result = {
        "id": vehicle.id,
        "name": vehicle.name,
        "model": vehicle.model,
        "license_plate": vehicle.license_plate,
        "max_capacity": vehicle.max_capacity,
        "odometer": vehicle.odometer,
        "vehicle_type": vehicle.vehicle_type,
        "acquisition_cost": vehicle.acquisition_cost,
        "status": vehicle.status,
        "region": vehicle.region,
        "created_at": vehicle.created_at,
        "total_fuel_cost": round(float(fuel_cost), 2),
        "total_maintenance_cost": round(float(maint_cost), 2),
        "total_revenue": round(float(revenue), 2),
        "roi": round(roi, 4),
    }
    return result


def _validate_status_transition(current: str, new: str):
    """Enforce valid status transitions for vehicles."""
    valid_transitions = {
        VehicleStatus.AVAILABLE.value: [VehicleStatus.ON_TRIP.value, VehicleStatus.IN_SHOP.value, VehicleStatus.RETIRED.value],
        VehicleStatus.ON_TRIP.value: [VehicleStatus.AVAILABLE.value],
        VehicleStatus.IN_SHOP.value: [VehicleStatus.AVAILABLE.value, VehicleStatus.RETIRED.value],
        VehicleStatus.RETIRED.value: [],  # Terminal state
    }
    allowed = valid_transitions.get(current, [])
    if new not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition vehicle from '{current}' to '{new}'. Allowed: {allowed}"
        )
