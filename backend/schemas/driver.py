"""
Pydantic schemas for Driver management.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class DriverCreate(BaseModel):
    full_name: str
    license_number: str
    license_expiry: date
    phone: Optional[str] = None
    status: str = "On Duty"


class DriverUpdate(BaseModel):
    full_name: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[date] = None
    phone: Optional[str] = None
    safety_score: Optional[float] = None
    complaints: Optional[int] = None
    status: Optional[str] = None


class DriverOut(BaseModel):
    id: int
    full_name: str
    license_number: str
    license_expiry: date
    phone: Optional[str]
    safety_score: float
    completion_rate: float
    total_trips: int
    completed_trips: int
    complaints: int
    status: str
    created_at: Optional[datetime] = None
    license_expired: Optional[bool] = False

    class Config:
        from_attributes = True
