"""
Dashboard service – aggregates KPIs for the Command Center.
All metrics are computed live from the database.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from models.vehicle import Vehicle, VehicleStatus
from models.trip import Trip, TripStatus
from models.driver import Driver
from models.maintenance import MaintenanceLog


def get_dashboard_kpis(db: Session, vehicle_type: str = None, status_filter: str = None, region: str = None) -> dict:
    """
    Compute all Command Center KPIs:
      - Active Fleet: vehicles with status "On Trip"
      - Maintenance Alerts: vehicles with status "In Shop"
      - Utilization Rate: (Assigned / Total) × 100
      - Pending Cargo: trips in Draft
      - Total vehicles, drivers, trips
    """
    # Base vehicle query with optional filters
    v_query = db.query(Vehicle)
    if vehicle_type:
        v_query = v_query.filter(Vehicle.vehicle_type == vehicle_type)
    if region:
        v_query = v_query.filter(Vehicle.region == region)

    total_vehicles = v_query.count()
    active_fleet = v_query.filter(Vehicle.status == VehicleStatus.ON_TRIP.value).count()
    maintenance_alerts = v_query.filter(Vehicle.status == VehicleStatus.IN_SHOP.value).count()
    available_vehicles = v_query.filter(Vehicle.status == VehicleStatus.AVAILABLE.value).count()
    retired_vehicles = v_query.filter(Vehicle.status == VehicleStatus.RETIRED.value).count()

    # Assigned = On Trip + In Shop (vehicles in use)
    assigned = active_fleet + maintenance_alerts
    utilization_rate = round((assigned / total_vehicles * 100) if total_vehicles > 0 else 0, 2)

    # Trip stats
    t_query = db.query(Trip)
    pending_cargo = t_query.filter(Trip.status == TripStatus.DRAFT.value).count()
    dispatched_trips = t_query.filter(Trip.status == TripStatus.DISPATCHED.value).count()
    completed_trips = t_query.filter(Trip.status == TripStatus.COMPLETED.value).count()
    total_trips = t_query.count()

    # Driver stats
    total_drivers = db.query(Driver).count()
    on_duty_drivers = db.query(Driver).filter(Driver.status == "On Duty").count()
    on_trip_drivers = db.query(Driver).filter(Driver.status == "On Trip").count()

    # Open maintenance logs
    open_maintenance = db.query(MaintenanceLog).filter(
        MaintenanceLog.status != "Resolved"
    ).count()

    return {
        "active_fleet": active_fleet,
        "maintenance_alerts": maintenance_alerts,
        "utilization_rate": utilization_rate,
        "pending_cargo": pending_cargo,
        "total_vehicles": total_vehicles,
        "available_vehicles": available_vehicles,
        "retired_vehicles": retired_vehicles,
        "dispatched_trips": dispatched_trips,
        "completed_trips": completed_trips,
        "total_trips": total_trips,
        "total_drivers": total_drivers,
        "on_duty_drivers": on_duty_drivers,
        "on_trip_drivers": on_trip_drivers,
        "open_maintenance": open_maintenance,
    }
