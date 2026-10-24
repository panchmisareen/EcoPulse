from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(200), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar_color = Column(String(20), default="#26734D")
    bio = Column(Text, nullable=True)
    timezone = Column(String(50), default="Asia/Kolkata")
    is_active = Column(Boolean, default=True)
    is_demo = Column(Boolean, default=False)

    # Preferences
    daily_hydration_goal_ml = Column(Integer, default=2000)
    weekly_active_travel_goal_km = Column(Float, default=20.0)
    weekly_movement_goal_minutes = Column(Integer, default=150)
    weekly_meal_swap_goal = Column(Integer, default=5)
    weekly_focus = Column(String(200), nullable=True)

    # Stats (derived, updated on completion)
    total_points = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_activity_date = Column(String(10), nullable=True)  # YYYY-MM-DD

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    mission_completions = relationship("MissionCompletion", back_populates="user")
    activity_logs = relationship("ActivityLog", back_populates="user")
    user_badges = relationship("UserBadge", back_populates="user")
    goals = relationship("Goal", back_populates="user")
    team_memberships = relationship("TeamMembership", back_populates="user")
