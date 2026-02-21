from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from middleware import require_roles
from models.user import User
from schemas.trip import TripCreate, TripUpdate, TripComplete, TripOut
from services.trip_service import (
    get_all_trips, get_trip_by_id, create_trip,
    dispatch_trip, complete_trip, cancel_trip, enrich_trip,
)
from services.audit_service import log_action, Actions

router = APIRouter(prefix="/api/trips", tags=["Trips"])

READ_ROLES = ["fleet_manager", "dispatcher", "financial_analyst"]
WRITE_ROLES = ["dispatcher"]


@router.get("/", response_model=List[TripOut])
def list_trips(
    status: str = Query(None),
    search: str = Query(None),
    current_user: User = Depends(require_roles(READ_ROLES)),
    db: Session = Depends(get_db),
):
    trips = get_all_trips(db, status_filter=status, search=search)
    return [enrich_trip(db, t) for t in trips]


@router.get("/{trip_id}", response_model=TripOut)
def get_trip(
    trip_id: int,
    current_user: User = Depends(require_roles(READ_ROLES)),
    db: Session = Depends(get_db),
):
    trip = get_trip_by_id(db, trip_id)
    return enrich_trip(db, trip)


@router.post("/", response_model=TripOut, status_code=201)
def add_trip(
    data: TripCreate,
    current_user: User = Depends(require_roles(WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    """Create a new trip in Draft status. Validates capacity + driver eligibility."""
    trip = create_trip(db, data)
    log_action(db, current_user.id, Actions.CREATE_TRIP, "trip", trip.id,
               f"Created trip {trip.origin}→{trip.destination} vehicle={trip.vehicle_id} driver={trip.driver_id}")
    db.commit()
    db.refresh(trip)
    return enrich_trip(db, trip)


@router.post("/{trip_id}/dispatch", response_model=TripOut)
def dispatch(
    trip_id: int,
    current_user: User = Depends(require_roles(WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    """Dispatch a draft trip → sets vehicle/driver to On Trip. ATOMIC commit."""
    trip = dispatch_trip(db, trip_id)
    log_action(db, current_user.id, Actions.DISPATCH_TRIP, "trip", trip.id,
               f"Dispatched trip {trip.origin}→{trip.destination}")
    db.commit()
    db.refresh(trip)
    return enrich_trip(db, trip)


@router.post("/{trip_id}/complete", response_model=TripOut)
def complete(
    trip_id: int,
    data: TripComplete,
    current_user: User = Depends(require_roles(WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    """Complete a dispatched trip → resets vehicle/driver, updates odometer. ATOMIC commit."""
    trip = complete_trip(db, trip_id, data)
    log_action(db, current_user.id, Actions.COMPLETE_TRIP, "trip", trip.id,
               f"Completed trip {trip.origin}→{trip.destination} distance={data.distance}km")
    db.commit()
    db.refresh(trip)
    return enrich_trip(db, trip)


@router.post("/{trip_id}/cancel", response_model=TripOut)
def cancel(
    trip_id: int,
    current_user: User = Depends(require_roles(WRITE_ROLES)),
    db: Session = Depends(get_db),
):
    """Cancel a trip (draft or dispatched). ATOMIC commit."""
    trip = cancel_trip(db, trip_id)
    log_action(db, current_user.id, Actions.CANCEL_TRIP, "trip", trip.id,
               f"Cancelled trip {trip.origin}→{trip.destination}")
    db.commit()
    db.refresh(trip)
    return enrich_trip(db, trip)
