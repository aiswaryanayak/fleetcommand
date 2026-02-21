"""
Dashboard router – Command Center KPIs.
All roles can view the dashboard.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from middleware import get_current_user
from models.user import User
from services.dashboard_service import get_dashboard_kpis

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/kpis")
def dashboard_kpis(
    vehicle_type: str = Query(None),
    status: str = Query(None),
    region: str = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns all Command Center KPIs.
    Supports filtering by vehicle_type, status, region.
    """
    return get_dashboard_kpis(db, vehicle_type=vehicle_type, status_filter=status, region=region)
