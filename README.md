# Fleet Manager — ERP-Style Fleet Management System

A production-quality, rule-driven Fleet Management ERP web application built for a competitive hackathon. It replaces inefficient manual fleet logbooks with a centralized digital hub that optimizes the lifecycle of a delivery fleet, monitors driver safety, and tracks financial performance.

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   Frontend                       │
│  React 18 + Vite + TailwindCSS + Recharts        │
│  8 pages · RBAC nav · CSV/PDF export             │
│  Port 5173 → /api proxy → Backend                │
└────────────────────┬─────────────────────────────┘
                     │ Axios + JWT Bearer
┌────────────────────▼─────────────────────────────┐
│                   Backend                        │
│  FastAPI + SQLAlchemy + Pydantic                  │
│  7 routers · 6 services · RBAC middleware         │
│  Port 8000                                       │
└────────────────────┬─────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────┐
│              SQLite Database                      │
│  7 tables: users, vehicles, drivers, trips,       │
│  maintenance_logs, fuel_logs, expenses            │
└──────────────────────────────────────────────────┘
```

## Key Features

| Feature | Description |
|---------|-------------|
| **Command Center** | Dashboard with 8 KPIs, fleet utilization rate, pending cargo |
| **Vehicle Registry** | Full CRUD, computed ROI, fuel & maintenance cost tracking |
| **Trip Dispatcher** | State machine lifecycle: Draft → Dispatched → Completed/Cancelled |
| **Maintenance Logs** | Auto vehicle status sync (In Shop ↔ Available) |
| **Expense & Fuel** | Tabbed finance tracking, category-based expense logging |
| **Driver Safety** | Safety scores, license expiry alerts, completion rates |
| **Analytics** | Recharts visualizations, one-click CSV & PDF export |
| **RBAC** | 4 roles with strict middleware-enforced permissions |

## Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **Fleet Manager** | Vehicles, Maintenance, Analytics, Dashboard |
| **Dispatcher** | Trips (full lifecycle), Dashboard |
| **Safety Officer** | Drivers, Dashboard |
| **Financial Analyst** | Fuel Logs, Expenses, Analytics, Dashboard |

## Database Schema

```
Users(id, email, hashed_password, full_name, role, is_active)
Vehicles(id, license_plate, make, model, year, type, status, max_capacity_kg, current_odometer)
Drivers(id, full_name, license_number, license_expiry, phone, status, safety_score, ...)
Trips(id, vehicle_id→, driver_id→, origin, destination, cargo_weight, status, distance_km, revenue)
MaintenanceLogs(id, vehicle_id→, description, cost, status, resolved_at)
FuelLogs(id, vehicle_id→, trip_id→, liters, cost, odometer_reading)
Expenses(id, vehicle_id→, trip_id→, category, amount, description)
```

## Business Rules (Atomic State Transitions)

### Trip Lifecycle
- **Create**: Validates cargo weight ≤ vehicle capacity, driver license not expired, driver status = On Duty, vehicle status = Available
- **Dispatch**: Atomically sets vehicle → On Trip, driver → On Trip
- **Complete**: Atomically sets vehicle → Available, driver → On Duty, updates odometer, recalculates driver stats
- **Cancel**: Atomically reverses dispatch state if trip was dispatched

### Maintenance Sync
- **Create**: Vehicle auto-set to "In Shop"
- **Resolve**: If no other open logs, vehicle auto-set to "Available"

### Driver Safety Score
```
safety_score = 100 - (complaints × 5) - (cancellation_rate × 20)
completion_rate = (completed_trips / total_trips) × 100
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm 9+

### 1. Backend

```bash
cd fleet-manager/backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend auto-seeds demo data on first startup (4 users, vehicles, drivers, trips, etc.)

### 2. Frontend

```bash
cd fleet-manager/frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Fleet Manager | fleet@demo.com | password123 |
| Dispatcher | dispatch@demo.com | password123 |
| Safety Officer | safety@demo.com | password123 |
| Financial Analyst | finance@demo.com | password123 |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS 3.4, Recharts, Lucide Icons |
| Backend | Python, FastAPI, SQLAlchemy ORM, Pydantic v2 |
| Auth | JWT (PyJWT) + bcrypt password hashing |
| Database | SQLite (zero-config, portable) |
| Exports | jsPDF + jspdf-autotable (PDF), PapaParse (CSV) |

## API Documentation

With the backend running, visit **http://localhost:8000/docs** for the interactive Swagger UI with all endpoints documented.

## Project Structure

```
fleet-manager/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # App configuration
│   ├── database.py          # SQLAlchemy setup
│   ├── auth.py              # JWT + bcrypt helpers
│   ├── middleware.py         # RBAC middleware
│   ├── seed.py              # Demo data seeder
│   ├── requirements.txt
│   ├── models/              # SQLAlchemy models (7 tables)
│   ├── schemas/             # Pydantic request/response schemas
│   ├── services/            # Business logic layer
│   └── routers/             # API route handlers
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx          # Router + guards
│       ├── main.jsx         # React entry
│       ├── context/         # AuthContext
│       ├── services/        # API client
│       ├── components/      # Shared UI components
│       └── pages/           # 8 page components
└── README.md
```
