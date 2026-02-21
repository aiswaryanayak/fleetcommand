"""
Application configuration.
Centralizes all settings for the Fleet Management ERP backend.
All values are overridable via environment variables for deployment.
"""
import os
from datetime import timedelta

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./fleet_manager.db")

SECRET_KEY = os.getenv("SECRET_KEY", "fleet-mgr-hackathon-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRE_MINUTES", "480"))  # 8 hours

ROLES = ["fleet_manager", "dispatcher", "safety_officer", "financial_analyst"]

# When serving the SPA from the same origin, CORS is only needed for dev.
# In production the frontend is served from the same port, so "*" is safe.
_default_origins = "http://localhost:5173,http://localhost:8000,http://127.0.0.1:8000"
CORS_ORIGINS = os.getenv("CORS_ORIGINS", _default_origins).split(",")

PORT = int(os.getenv("PORT", "8000"))
