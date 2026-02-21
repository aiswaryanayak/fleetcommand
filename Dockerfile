# ============================================================================
# FleetCommand ERP – Multi-stage Dockerfile
# Stage 1: Build React frontend with Node
# Stage 2: Python runtime serving FastAPI + built SPA
# ============================================================================

# ── Stage 1: Frontend build ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Copy package files (use lock file if available)
COPY frontend/package.json ./
COPY frontend/package-lock.json* ./

# Install deps — prefer ci when lock file exists, fall back to install
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi

COPY frontend/ ./
RUN npm run build


# ── Stage 2: Python backend + served SPA ─────────────────────────────────────
FROM python:3.12-slim AS runtime

LABEL org.opencontainers.image.title="FleetCommand ERP" \
      org.opencontainers.image.source="https://github.com/aiswaryanayak/fleetcommand"

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install Python dependencies first (better cache layer)
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend from stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Set working directory to backend for module imports
WORKDIR /app/backend

# Render uses PORT env var (default 10000), other platforms may use 8000
EXPOSE ${PORT:-10000}

# Run with gunicorn + uvicorn workers for production
CMD ["sh", "-c", "gunicorn main:app --bind 0.0.0.0:${PORT:-10000} --workers 2 --worker-class uvicorn.workers.UvicornWorker --timeout 120 --access-logfile -"]
