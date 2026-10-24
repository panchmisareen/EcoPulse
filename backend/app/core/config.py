from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./ecopulse.db"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    FRONTEND_URL: str = "http://localhost:5173"
    DEMO_MODE: bool = True
    DEMO_USER_ID: int = 1
    GEMINI_API_KEY: str = "AIzaSyAYPIm4y3kdYgpfGe9E2tPN3hTLgSg5K-I"

    # Emission factors (kg CO2 per km)
    EMISSION_FACTOR_CAR: float = 0.21
    EMISSION_FACTOR_BUS: float = 0.089
    EMISSION_FACTOR_BIKE: float = 0.0
    EMISSION_FACTOR_WALK: float = 0.0

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
