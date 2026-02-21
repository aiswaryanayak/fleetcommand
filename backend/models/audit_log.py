"""
AuditLog model – immutable record of state-changing operations.
Tracks who did what, when, and to which entity.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)  # CREATE_TRIP, DISPATCH_TRIP, etc.
    entity_type = Column(String(50), nullable=False, index=True)  # trip, vehicle, driver, etc.
    entity_id = Column(Integer, nullable=False)
    details = Column(String(1000), nullable=True)  # Human-readable summary
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationship
    user = relationship("User")
