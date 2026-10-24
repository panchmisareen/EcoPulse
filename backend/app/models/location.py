from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class CampusLocation(Base):
    __tablename__ = "campus_locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False)  # water_refill, bike_parking, recycling, food, walking_route
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    map_x = Column(Float, nullable=True)  # percentage x for SVG/canvas map
    map_y = Column(Float, nullable=True)  # percentage y for SVG/canvas map
    address = Column(String(300), nullable=True)
    is_verified = Column(Boolean, default=False)
    is_demo = Column(Boolean, default=True)
    extra_info = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
