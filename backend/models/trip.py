"""
Trip model – core workflow entity with lifecycle state machine.
Draft → Dispatched → Completed | Cancelled
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum


class TripStatus(str, enum.Enum):
    DRAFT = "Draft"
    DISPATCHED = "Dispatched"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    cargo_weight = Column(Float, nullable=False)           # kg
    origin = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    distance = Column(Float, default=0.0)                  # km (set on completion)
    estimated_fuel_cost = Column(Float, default=0.0)
    revenue = Column(Float, default=0.0)                   # revenue earned
    status = Column(String(20), default=TripStatus.DRAFT.value)
    scheduled_date = Column(Date)
    completed_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")
    fuel_logs = relationship("FuelLog", back_populates="trip")
    expenses = relationship("Expense", back_populates="trip")
