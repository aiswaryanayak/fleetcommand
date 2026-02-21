"""
Finance service – fuel logs, expenses, and financial analytics.
Handles:
  - Fuel log CRUD
  - Expense CRUD
  - Financial computations (ROI, efficiency, cost summaries)
"""
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func, extract
from fastapi import HTTPException
from models.fuel_log import FuelLog
from models.expense import Expense
from models.vehicle import Vehicle
from models.trip import Trip
from models.maintenance import MaintenanceLog
from schemas.finance import FuelLogCreate, ExpenseCreate


# ── Fuel Logs ─────────────────────────────────────────────────────────────────

def get_all_fuel_logs(db: Session, vehicle_id: int = None):
    query = db.query(FuelLog)
    if vehicle_id:
        query = query.filter(FuelLog.vehicle_id == vehicle_id)
    return query.order_by(FuelLog.id.desc()).all()


def create_fuel_log(db: Session, data: FuelLogCreate) -> FuelLog:
    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    log = FuelLog(**data.model_dump())
    db.add(log)
    db.flush()
    return log


def delete_fuel_log(db: Session, log_id: int):
    log = db.query(FuelLog).filter(FuelLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Fuel log not found")
    db.delete(log)
    db.flush()
    return {"detail": "Fuel log deleted", "id": log_id}


def enrich_fuel_log(db: Session, log: FuelLog) -> dict:
    vehicle = db.query(Vehicle).filter(Vehicle.id == log.vehicle_id).first()
    return {
        "id": log.id,
        "vehicle_id": log.vehicle_id,
        "trip_id": log.trip_id,
        "date": log.date,
        "liters": log.liters,
        "cost": log.cost,
        "odometer_reading": log.odometer_reading,
        "created_at": log.created_at,
        "vehicle_name": vehicle.name if vehicle else None,
    }


# ── Expenses ──────────────────────────────────────────────────────────────────

def get_all_expenses(db: Session, vehicle_id: int = None, category: str = None):
    query = db.query(Expense)
    if vehicle_id:
        query = query.filter(Expense.vehicle_id == vehicle_id)
    if category:
        query = query.filter(Expense.category == category)
    return query.order_by(Expense.id.desc()).all()


def create_expense(db: Session, data: ExpenseCreate) -> Expense:
    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    expense = Expense(**data.model_dump())
    db.add(expense)
    db.flush()
    return expense


def delete_expense(db: Session, expense_id: int):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.flush()
    return {"detail": "Expense deleted", "id": expense_id}


def enrich_expense(db: Session, expense: Expense) -> dict:
    vehicle = db.query(Vehicle).filter(Vehicle.id == expense.vehicle_id).first()
    return {
        "id": expense.id,
        "vehicle_id": expense.vehicle_id,
        "trip_id": expense.trip_id,
        "category": expense.category,
        "description": expense.description,
        "amount": expense.amount,
        "date": expense.date,
        "created_at": expense.created_at,
        "vehicle_name": vehicle.name if vehicle else None,
    }


# ── Financial Analytics ───────────────────────────────────────────────────────

def get_financial_summary(db: Session) -> dict:
    """Compute full financial summary across the fleet."""
    total_fuel = db.query(sql_func.coalesce(sql_func.sum(FuelLog.cost), 0.0)).scalar()
    total_maintenance = db.query(sql_func.coalesce(sql_func.sum(MaintenanceLog.cost), 0.0)).scalar()
    total_expenses = db.query(sql_func.coalesce(sql_func.sum(Expense.amount), 0.0)).scalar()
    total_revenue = db.query(sql_func.coalesce(sql_func.sum(Trip.revenue), 0.0)).filter(
        Trip.status == "Completed"
    ).scalar()
    total_liters = db.query(sql_func.coalesce(sql_func.sum(FuelLog.liters), 0.0)).scalar()
    total_distance = db.query(sql_func.coalesce(sql_func.sum(Trip.distance), 0.0)).filter(
        Trip.status == "Completed"
    ).scalar()

    fuel_efficiency = round(float(total_distance) / float(total_liters), 2) if float(total_liters) > 0 else 0

    total_cost = float(total_fuel) + float(total_maintenance) + float(total_expenses)
    profit = float(total_revenue) - total_cost

    # Fleet ROI
    total_acquisition = db.query(sql_func.coalesce(sql_func.sum(Vehicle.acquisition_cost), 0.0)).scalar()
    fleet_roi = round(profit / float(total_acquisition), 4) if float(total_acquisition) > 0 else 0

    return {
        "total_fuel_cost": round(float(total_fuel), 2),
        "total_maintenance_cost": round(float(total_maintenance), 2),
        "total_expenses": round(float(total_expenses), 2),
        "total_revenue": round(float(total_revenue), 2),
        "total_cost": round(total_cost, 2),
        "profit": round(profit, 2),
        "fuel_efficiency_km_per_liter": fuel_efficiency,
        "fleet_roi": fleet_roi,
        "total_distance_km": round(float(total_distance), 2),
        "total_liters": round(float(total_liters), 2),
    }


def get_monthly_summary(db: Session) -> list:
    """Monthly revenue vs cost vs profit breakdown."""
    # Get monthly fuel costs
    months = {}

    # Fuel by month
    fuel_monthly = db.query(
        extract('year', FuelLog.date).label('year'),
        extract('month', FuelLog.date).label('month'),
        sql_func.sum(FuelLog.cost).label('fuel_cost'),
        sql_func.sum(FuelLog.liters).label('liters'),
    ).group_by('year', 'month').all()

    for row in fuel_monthly:
        key = f"{int(row.year)}-{int(row.month):02d}"
        months.setdefault(key, {"month": key, "fuel_cost": 0, "maintenance_cost": 0, "expenses": 0, "revenue": 0, "liters": 0, "distance": 0})
        months[key]["fuel_cost"] = round(float(row.fuel_cost), 2)
        months[key]["liters"] = round(float(row.liters), 2)

    # Maintenance by month
    maint_monthly = db.query(
        extract('year', MaintenanceLog.date).label('year'),
        extract('month', MaintenanceLog.date).label('month'),
        sql_func.sum(MaintenanceLog.cost).label('maint_cost'),
    ).group_by('year', 'month').all()

    for row in maint_monthly:
        key = f"{int(row.year)}-{int(row.month):02d}"
        months.setdefault(key, {"month": key, "fuel_cost": 0, "maintenance_cost": 0, "expenses": 0, "revenue": 0, "liters": 0, "distance": 0})
        months[key]["maintenance_cost"] = round(float(row.maint_cost), 2)

    # Expenses by month
    exp_monthly = db.query(
        extract('year', Expense.date).label('year'),
        extract('month', Expense.date).label('month'),
        sql_func.sum(Expense.amount).label('exp_cost'),
    ).group_by('year', 'month').all()

    for row in exp_monthly:
        key = f"{int(row.year)}-{int(row.month):02d}"
        months.setdefault(key, {"month": key, "fuel_cost": 0, "maintenance_cost": 0, "expenses": 0, "revenue": 0, "liters": 0, "distance": 0})
        months[key]["expenses"] = round(float(row.exp_cost), 2)

    # Revenue by completion month
    rev_monthly = db.query(
        extract('year', Trip.completed_date).label('year'),
        extract('month', Trip.completed_date).label('month'),
        sql_func.sum(Trip.revenue).label('revenue'),
        sql_func.sum(Trip.distance).label('distance'),
    ).filter(Trip.status == "Completed", Trip.completed_date.isnot(None)).group_by('year', 'month').all()

    for row in rev_monthly:
        if row.year and row.month:
            key = f"{int(row.year)}-{int(row.month):02d}"
            months.setdefault(key, {"month": key, "fuel_cost": 0, "maintenance_cost": 0, "expenses": 0, "revenue": 0, "liters": 0, "distance": 0})
            months[key]["revenue"] = round(float(row.revenue), 2)
            months[key]["distance"] = round(float(row.distance), 2)

    # Compute profit for each month
    result = []
    for key in sorted(months.keys()):
        m = months[key]
        total_cost = m["fuel_cost"] + m["maintenance_cost"] + m["expenses"]
        m["total_cost"] = round(total_cost, 2)
        m["profit"] = round(m["revenue"] - total_cost, 2)
        m["fuel_efficiency"] = round(m["distance"] / m["liters"], 2) if m["liters"] > 0 else 0
        result.append(m)

    return result


def get_top_expensive_vehicles(db: Session, limit: int = 5) -> list:
    """Top N most expensive vehicles by total operational cost."""
    vehicles = db.query(Vehicle).all()
    costs = []
    for v in vehicles:
        fuel = db.query(sql_func.coalesce(sql_func.sum(FuelLog.cost), 0.0)).filter(FuelLog.vehicle_id == v.id).scalar()
        maint = db.query(sql_func.coalesce(sql_func.sum(MaintenanceLog.cost), 0.0)).filter(MaintenanceLog.vehicle_id == v.id).scalar()
        exp = db.query(sql_func.coalesce(sql_func.sum(Expense.amount), 0.0)).filter(Expense.vehicle_id == v.id).scalar()
        total = float(fuel) + float(maint) + float(exp)
        costs.append({
            "vehicle_id": v.id,
            "vehicle_name": v.name,
            "license_plate": v.license_plate,
            "total_cost": round(total, 2),
            "fuel_cost": round(float(fuel), 2),
            "maintenance_cost": round(float(maint), 2),
            "expense_cost": round(float(exp), 2),
        })
    costs.sort(key=lambda x: x["total_cost"], reverse=True)
    return costs[:limit]


def get_idle_vehicles(db: Session) -> list:
    """Dead stock: vehicles that are Available but have had no trips in the last 30 days."""
    from datetime import timedelta
    cutoff = date.today() - timedelta(days=30)
    vehicles = db.query(Vehicle).filter(Vehicle.status == "Available").all()
    idle = []
    for v in vehicles:
        recent = db.query(Trip).filter(
            Trip.vehicle_id == v.id,
            Trip.created_at >= cutoff
        ).count()
        if recent == 0:
            idle.append({
                "vehicle_id": v.id,
                "vehicle_name": v.name,
                "license_plate": v.license_plate,
                "status": v.status,
                "odometer": v.odometer,
            })
    return idle
