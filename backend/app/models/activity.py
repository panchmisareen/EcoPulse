from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_type = Column(String(50), nullable=False)  # travel, meal_swap, movement, hydration
    sub_type = Column(String(50), nullable=True)  # walk, cycle, bus, car, etc.
    duration_minutes = Column(Float, nullable=True)
    distance_km = Column(Float, nullable=True)
    water_ml = Column(Integer, nullable=True)
    reusable_bottle = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    extra_data = Column(JSON, nullable=True)
    logged_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="activity_logs")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(50), nullable=False)
    target_value = Column(Float, nullable=False)
    unit = Column(String(30), nullable=False)
    period = Column(String(20), default="weekly")  # daily, weekly
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="goals")
