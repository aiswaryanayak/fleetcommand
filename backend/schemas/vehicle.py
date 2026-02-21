from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class VehicleCreate(BaseModel):
    name: str
    model: str
    license_plate: str
    max_capacity: float = Field(gt=0, description="Max load capacity in kg")
    odometer: float = Field(ge=0, default=0.0)
    vehicle_type: str = Field(description="Truck | Van | Bike")
    acquisition_cost: float = Field(ge=0, default=0.0)
    region: str = "Default"


class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    model: Optional[str] = None
    max_capacity: Optional[float] = None
    odometer: Optional[float] = None
    vehicle_type: Optional[str] = None
    acquisition_cost: Optional[float] = None
    status: Optional[str] = None
    region: Optional[str] = None


class VehicleOut(BaseModel):
    id: int
    name: str
    model: str
    license_plate: str
    max_capacity: float
    odometer: float
    vehicle_type: str
    acquisition_cost: float
    status: str
    region: str
    created_at: Optional[datetime] = None
    # Computed fields added in response
    total_fuel_cost: Optional[float] = 0.0
    total_maintenance_cost: Optional[float] = 0.0
    total_revenue: Optional[float] = 0.0
    roi: Optional[float] = 0.0

    class Config:
        from_attributes = True
