"""
MaintenanceLog model – tracks vehicle service events.
Creating a log automatically moves vehicle to "In Shop".
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum


class MaintenanceStatus(str, enum.Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    RESOLVED = "Resolved"


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    issue = Column(String(500), nullable=False)
    description = Column(String(1000))
    date = Column(Date, nullable=False)
    cost = Column(Float, default=0.0)
    status = Column(String(20), default=MaintenanceStatus.OPEN.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    vehicle = relationship("Vehicle", back_populates="maintenance_logs")
