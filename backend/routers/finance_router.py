from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from middleware import require_roles
from models.user import User
from schemas.finance import FuelLogCreate, FuelLogOut, ExpenseCreate, ExpenseOut
from services.finance_service import (
    get_all_fuel_logs, create_fuel_log, delete_fuel_log, enrich_fuel_log,
    get_all_expenses, create_expense, delete_expense, enrich_expense,
    get_financial_summary, get_monthly_summary,
    get_top_expensive_vehicles, get_idle_vehicles,
)
from services.audit_service import log_action, Actions

router = APIRouter(prefix="/api/finance", tags=["Finance"])

FUEL_READ_ROLES = ["fleet_manager", "dispatcher", "financial_analyst"]
FUEL_WRITE_ROLES = ["financial_analyst"]
ANALYTICS_ROLES = ["fleet_manager", "financial_analyst"]



@router.get("/fuel-logs", response_model=List[FuelLogOut])
def list_fuel_logs(
    vehicle_id: int = Query(None),
    current_user: User = Depends(require_roles(FUEL_READ_ROLES)),
    db: Session = Depends(get_db),
):
    logs = get_all_fuel_logs(db, vehicle_id=vehicle_id)
    return [enrich_fuel_log(db, l) for l in logs]


@router.post("/fuel-logs", response_model=FuelLogOut, status_code=201)
def add_fuel_log(
    data: FuelLogCreate,
    current_user: User = Depends(require_roles(FUEL_WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    log = create_fuel_log(db, data)
    log_action(db, current_user.id, Actions.CREATE_FUEL_LOG, "fuel_log", log.id,
               f"Added fuel log for vehicle #{log.vehicle_id}: {log.liters}L, ${log.cost}")
    db.commit()
    db.refresh(log)
    return enrich_fuel_log(db, log)


@router.delete("/fuel-logs/{log_id}")
def remove_fuel_log(
    log_id: int,
    current_user: User = Depends(require_roles(FUEL_WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    result = delete_fuel_log(db, log_id)
    log_action(db, current_user.id, Actions.DELETE_FUEL_LOG, "fuel_log", log_id,
               f"Deleted fuel log #{log_id}")
    db.commit()
    return result



@router.get("/expenses", response_model=List[ExpenseOut])
def list_expenses(
    vehicle_id: int = Query(None),
    category: str = Query(None),
    current_user: User = Depends(require_roles(FUEL_READ_ROLES)),
    db: Session = Depends(get_db),
):
    expenses = get_all_expenses(db, vehicle_id=vehicle_id, category=category)
    return [enrich_expense(db, e) for e in expenses]


@router.post("/expenses", response_model=ExpenseOut, status_code=201)
def add_expense(
    data: ExpenseCreate,
    current_user: User = Depends(require_roles(FUEL_WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    expense = create_expense(db, data)
    log_action(db, current_user.id, Actions.CREATE_EXPENSE, "expense", expense.id,
               f"Added expense for vehicle #{expense.vehicle_id}: ${expense.amount} ({expense.category})")
    db.commit()
    db.refresh(expense)
    return enrich_expense(db, expense)


@router.delete("/expenses/{expense_id}")
def remove_expense(
    expense_id: int,
    current_user: User = Depends(require_roles(FUEL_WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    result = delete_expense(db, expense_id)
    log_action(db, current_user.id, Actions.DELETE_EXPENSE, "expense", expense_id,
               f"Deleted expense #{expense_id}")
    db.commit()
    return result



@router.get("/summary")
def financial_summary(
    current_user: User = Depends(require_roles(ANALYTICS_ROLES)),
    db: Session = Depends(get_db),
):
    """Overall financial summary – fuel, maintenance, revenue, ROI."""
    return get_financial_summary(db)


@router.get("/monthly")
def monthly_summary(
    current_user: User = Depends(require_roles(ANALYTICS_ROLES)),
    db: Session = Depends(get_db),
):
    """Monthly breakdown of revenue, costs, profit."""
    return get_monthly_summary(db)


@router.get("/top-expensive")
def top_expensive(
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(require_roles(ANALYTICS_ROLES)),
    db: Session = Depends(get_db),
):
    """Top N most expensive vehicles by total operational cost."""
    return get_top_expensive_vehicles(db, limit=limit)


@router.get("/idle-vehicles")
def idle_vehicles(
    current_user: User = Depends(require_roles(ANALYTICS_ROLES)),
    db: Session = Depends(get_db),
):
    """Dead stock – available vehicles with no trips in last 30 days."""
    return get_idle_vehicles(db)
