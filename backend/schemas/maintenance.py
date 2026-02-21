"""
Pydantic schemas for Maintenance Logs.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class MaintenanceLogCreate(BaseModel):
    vehicle_id: int
    issue: str
    description: Optional[str] = None
    date: date
    cost: float = Field(ge=0, default=0.0)


class MaintenanceLogUpdate(BaseModel):
    issue: Optional[str] = None
    description: Optional[str] = None
    cost: Optional[float] = None
    status: Optional[str] = None


class MaintenanceLogOut(BaseModel):
    id: int
    vehicle_id: int
    issue: str
    description: Optional[str]
    date: date
    cost: float
    status: str
    created_at: Optional[datetime] = None
    vehicle_name: Optional[str] = None

    class Config:
        from_attributes = True
