"""
Vehicle model – represents fleet assets with lifecycle status.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "Available"
    ON_TRIP = "On Trip"
    IN_SHOP = "In Shop"
    RETIRED = "Retired"


class VehicleType(str, enum.Enum):
    TRUCK = "Truck"
    VAN = "Van"
    BIKE = "Bike"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    model = Column(String(255), nullable=False)
    license_plate = Column(String(50), unique=True, nullable=False, index=True)
    max_capacity = Column(Float, nullable=False)           # kg
    odometer = Column(Float, default=0.0)                  # km
    vehicle_type = Column(String(20), nullable=False)      # Truck | Van | Bike
    acquisition_cost = Column(Float, default=0.0)
    status = Column(String(20), default=VehicleStatus.AVAILABLE.value)
    region = Column(String(100), default="Default")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    trips = relationship("Trip", back_populates="vehicle")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle")
    fuel_logs = relationship("FuelLog", back_populates="vehicle")
    expenses = relationship("Expense", back_populates="vehicle")
