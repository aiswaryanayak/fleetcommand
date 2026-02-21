"""
Driver model – tracks license, safety, and duty status.
"""
from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum


class DriverStatus(str, enum.Enum):
    ON_DUTY = "On Duty"
    OFF_DUTY = "Off Duty"
    ON_TRIP = "On Trip"
    SUSPENDED = "Suspended"


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    license_number = Column(String(100), unique=True, nullable=False, index=True)
    license_expiry = Column(Date, nullable=False)
    phone = Column(String(50))
    safety_score = Column(Float, default=100.0)     # 0-100
    completion_rate = Column(Float, default=0.0)     # percentage
    total_trips = Column(Integer, default=0)
    completed_trips = Column(Integer, default=0)
    complaints = Column(Integer, default=0)
    status = Column(String(20), default=DriverStatus.ON_DUTY.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    trips = relationship("Trip", back_populates="driver")
