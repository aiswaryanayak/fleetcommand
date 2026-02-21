"""
Fleet Management ERP – FastAPI Entry Point.
Registers all routers, configures CORS, serves the React SPA,
adds global error handling, and runs seed on startup.
"""
import logging
import os
import traceback
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from config import CORS_ORIGINS
from database import engine, Base

# ── Logging configuration ─────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("fleet")

# Import all models so they're registered with SQLAlchemy
from models.user import User
from models.vehicle import Vehicle
from models.driver import Driver
from models.trip import Trip
from models.maintenance import MaintenanceLog
from models.fuel_log import FuelLog
from models.expense import Expense
from models.audit_log import AuditLog

# Import routers
from routers.auth_router import router as auth_router
from routers.dashboard_router import router as dashboard_router
from routers.vehicle_router import router as vehicle_router
from routers.trip_router import router as trip_router
from routers.driver_router import router as driver_router
from routers.maintenance_router import router as maintenance_router
from routers.finance_router import router as finance_router
from routers.audit_router import router as audit_router

# ── Create tables ─────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── Resolve the frontend build directory ──────────────────────────────────────
# Supports override via env var for flexible deployments
STATIC_DIR = Path(os.getenv("STATIC_DIR", str(Path(__file__).resolve().parent.parent / "frontend" / "dist")))

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Fleet Management ERP",
    description="Centralized, rule-based digital hub for delivery fleet lifecycle management",
    version="1.0.0",
)


# ── Global exception handler — structured JSON, no stack traces ───────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch any unhandled exception and return a safe JSON response."""
    logger.error(
        "Unhandled exception on %s %s: %s\n%s",
        request.method, request.url.path, str(exc), traceback.format_exc(),
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred. Please try again later.",
            "error_type": type(exc).__name__,
        },
    )


# ── CORS middleware ───────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register API routers ─────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(vehicle_router)
app.include_router(trip_router)
app.include_router(driver_router)
app.include_router(maintenance_router)
app.include_router(finance_router)
app.include_router(audit_router)


# ── Health / info endpoint ────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


# ── Serve React SPA (only when frontend is built) ────────────────────────────
if STATIC_DIR.is_dir():
    # Mount the assets directory (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        """
        Catch-all route: serves the SPA index.html for any non-API path,
        enabling client-side routing (React Router).
        """
        # Try serving a static file first (e.g., favicon, manifest, etc.)
        file_path = STATIC_DIR / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        # Otherwise, serve the SPA entry point
        return FileResponse(STATIC_DIR / "index.html")
else:
    @app.get("/")
    def root():
        return {"message": "Fleet Management ERP API v1.0.0", "docs": "/docs",
                "note": "Frontend not built. Run 'npm run build' in frontend/"}


# ── Startup event – run seed ──────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    logger.info("Starting Fleet Management ERP v1.0.0")
    logger.info("Static dir: %s (exists=%s)", STATIC_DIR, STATIC_DIR.is_dir())
    from seed import seed
    seed()
    logger.info("Server ready — all routes registered")
