"""
Driver router – CRUD with RBAC and audit logging.
Safety Officer: full CRUD
Fleet Manager, Dispatcher: read-only
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from middleware import require_roles
from models.user import User
from schemas.driver import DriverCreate, DriverUpdate, DriverOut
from services.driver_service import (
    get_all_drivers, get_driver_by_id, create_driver,
    update_driver, delete_driver, enrich_driver,
)
from services.audit_service import log_action, Actions

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])

READ_ROLES = ["fleet_manager", "dispatcher", "safety_officer"]
WRITE_ROLES = ["safety_officer"]


@router.get("/", response_model=List[DriverOut])
def list_drivers(
    status: str = Query(None),
    search: str = Query(None),
    current_user: User = Depends(require_roles(READ_ROLES)),
    db: Session = Depends(get_db),
):
    drivers = get_all_drivers(db, status_filter=status, search=search)
    return [enrich_driver(d) for d in drivers]


@router.get("/{driver_id}", response_model=DriverOut)
def get_driver(
    driver_id: int,
    current_user: User = Depends(require_roles(READ_ROLES)),
    db: Session = Depends(get_db),
):
    driver = get_driver_by_id(db, driver_id)
    return enrich_driver(driver)


@router.post("/", response_model=DriverOut, status_code=201)
def add_driver(
    data: DriverCreate,
    current_user: User = Depends(require_roles(WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    driver = create_driver(db, data)
    log_action(db, current_user.id, Actions.CREATE_DRIVER, "driver", driver.id,
               f"Created driver {driver.full_name} ({driver.license_number})")
    db.commit()
    db.refresh(driver)
    return enrich_driver(driver)


@router.put("/{driver_id}", response_model=DriverOut)
def edit_driver(
    driver_id: int,
    data: DriverUpdate,
    current_user: User = Depends(require_roles(WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    driver = update_driver(db, driver_id, data)
    log_action(db, current_user.id, Actions.UPDATE_DRIVER, "driver", driver.id,
               f"Updated driver {driver.full_name}")
    db.commit()
    db.refresh(driver)
    return enrich_driver(driver)


@router.delete("/{driver_id}")
def remove_driver(
    driver_id: int,
    current_user: User = Depends(require_roles(WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    result = delete_driver(db, driver_id)
    log_action(db, current_user.id, Actions.DELETE_DRIVER, "driver", driver_id,
               f"Deleted driver #{driver_id}")
    db.commit()
    return result
