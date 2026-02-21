from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from middleware import require_roles, get_current_user
from models.user import User
from schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleOut
from services.vehicle_service import (
    get_all_vehicles, get_vehicle_by_id, create_vehicle,
    update_vehicle, retire_vehicle, delete_vehicle, enrich_vehicle,
)
from services.audit_service import log_action, Actions

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])

READ_ROLES = ["fleet_manager", "dispatcher", "financial_analyst"]
WRITE_ROLES = ["fleet_manager"]


@router.get("/", response_model=List[VehicleOut])
def list_vehicles(
    vehicle_type: str = Query(None),
    status: str = Query(None),
    region: str = Query(None),
    search: str = Query(None),
    current_user: User = Depends(require_roles(READ_ROLES)),
    db: Session = Depends(get_db),
):
    vehicles = get_all_vehicles(db, vehicle_type=vehicle_type, status_filter=status, region=region, search=search)
    return [enrich_vehicle(db, v) for v in vehicles]


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(
    vehicle_id: int,
    current_user: User = Depends(require_roles(READ_ROLES)),
    db: Session = Depends(get_db),
):
    vehicle = get_vehicle_by_id(db, vehicle_id)
    return enrich_vehicle(db, vehicle)


@router.post("/", response_model=VehicleOut, status_code=201)
def add_vehicle(
    data: VehicleCreate,
    current_user: User = Depends(require_roles(WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    vehicle = create_vehicle(db, data)
    log_action(db, current_user.id, Actions.CREATE_VEHICLE, "vehicle", vehicle.id,
               f"Created vehicle {vehicle.name} ({vehicle.license_plate})")
    db.commit()
    db.refresh(vehicle)
    return enrich_vehicle(db, vehicle)


@router.put("/{vehicle_id}", response_model=VehicleOut)
def edit_vehicle(
    vehicle_id: int,
    data: VehicleUpdate,
    current_user: User = Depends(require_roles(WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    vehicle = update_vehicle(db, vehicle_id, data)
    log_action(db, current_user.id, Actions.UPDATE_VEHICLE, "vehicle", vehicle.id,
               f"Updated vehicle {vehicle.name}")
    db.commit()
    db.refresh(vehicle)
    return enrich_vehicle(db, vehicle)


@router.post("/{vehicle_id}/retire", response_model=VehicleOut)
def retire(
    vehicle_id: int,
    current_user: User = Depends(require_roles(WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    vehicle = retire_vehicle(db, vehicle_id)
    log_action(db, current_user.id, Actions.RETIRE_VEHICLE, "vehicle", vehicle.id,
               f"Retired vehicle {vehicle.name}")
    db.commit()
    db.refresh(vehicle)
    return enrich_vehicle(db, vehicle)


@router.delete("/{vehicle_id}")
def remove_vehicle(
    vehicle_id: int,
    current_user: User = Depends(require_roles(WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    result = delete_vehicle(db, vehicle_id)
    log_action(db, current_user.id, Actions.DELETE_VEHICLE, "vehicle", vehicle_id,
               result["detail"])
    db.commit()
    return result
