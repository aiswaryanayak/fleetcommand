"""
Expense model – miscellaneous expenses linked to vehicles/trips.
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    category = Column(String(100), nullable=False)  # Tolls, Parking, Insurance, etc.
    description = Column(String(500))
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    vehicle = relationship("Vehicle", back_populates="expenses")
    trip = relationship("Trip", back_populates="expenses")
