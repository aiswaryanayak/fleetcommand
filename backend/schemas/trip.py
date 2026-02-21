from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class TripCreate(BaseModel):
    vehicle_id: int
    driver_id: int
    cargo_weight: float = Field(gt=0)
    origin: str
    destination: str
    distance: float = Field(ge=0, default=0.0)
    estimated_fuel_cost: float = Field(ge=0, default=0.0)
    revenue: float = Field(ge=0, default=0.0)
    scheduled_date: Optional[date] = None


class TripUpdate(BaseModel):
    cargo_weight: Optional[float] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    distance: Optional[float] = None
    estimated_fuel_cost: Optional[float] = None
    revenue: Optional[float] = None
    scheduled_date: Optional[date] = None


class TripDispatch(BaseModel):
    """Payload for dispatching a draft trip."""
    pass  # No extra fields needed; action-only


class TripComplete(BaseModel):
    """Payload for completing a dispatched trip."""
    distance: float = Field(gt=0, description="Actual distance traveled in km")
    revenue: Optional[float] = None


class TripOut(BaseModel):
    id: int
    vehicle_id: int
    driver_id: int
    cargo_weight: float
    origin: str
    destination: str
    distance: float
    estimated_fuel_cost: float
    revenue: float
    status: str
    scheduled_date: Optional[date]
    completed_date: Optional[datetime]
    created_at: Optional[datetime] = None
    # Joined fields
    vehicle_name: Optional[str] = None
    driver_name: Optional[str] = None

    class Config:
        from_attributes = True
