"""
Pydantic schemas for Fuel Logs and Expenses.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


# ── Fuel Log ──────────────────────────────────────────────────────────────────
class FuelLogCreate(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    date: date
    liters: float = Field(gt=0)
    cost: float = Field(gt=0)
    odometer_reading: float = Field(ge=0, default=0.0)


class FuelLogOut(BaseModel):
    id: int
    vehicle_id: int
    trip_id: Optional[int]
    date: date
    liters: float
    cost: float
    odometer_reading: float
    created_at: Optional[datetime] = None
    vehicle_name: Optional[str] = None

    class Config:
        from_attributes = True


# ── Expense ───────────────────────────────────────────────────────────────────
class ExpenseCreate(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    category: str
    description: Optional[str] = None
    amount: float = Field(gt=0)
    date: date


class ExpenseOut(BaseModel):
    id: int
    vehicle_id: int
    trip_id: Optional[int]
    category: str
    description: Optional[str]
    amount: float
    date: date
    created_at: Optional[datetime] = None
    vehicle_name: Optional[str] = None

    class Config:
        from_attributes = True
