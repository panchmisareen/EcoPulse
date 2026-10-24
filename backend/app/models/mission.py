from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Mission(Base):
    __tablename__ = "missions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)  # travel, meals, movement, hydration
    duration_minutes = Column(Integer, nullable=False)
    difficulty = Column(String(20), default="easy")  # easy, medium, hard
    instructions = Column(JSON, nullable=False)  # list of strings
    points = Column(Integer, default=10)
    metrics = Column(JSON, nullable=True)  # {"distance_km": 1, "co2_avoided_kg": 0.21}
    completion_criteria = Column(Text, nullable=True)
    icon = Column(String(50), default="leaf")
    color = Column(String(20), default="#26734D")
    is_active = Column(Boolean, default=True)
    tags = Column(JSON, nullable=True)  # ["beginner", "outdoor"]

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    completions = relationship("MissionCompletion", back_populates="mission")


class MissionCompletion(Base):
    __tablename__ = "mission_completions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mission_id = Column(Integer, ForeignKey("missions.id"), nullable=False)
    points_awarded = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True)  # extra data per completion
    completed_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="mission_completions")
    mission = relationship("Mission", back_populates="completions")
