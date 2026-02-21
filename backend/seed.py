from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from auth import hash_password
from models.user import User
from models.vehicle import Vehicle
from models.driver import Driver
from models.trip import Trip
from models.maintenance import MaintenanceLog
from models.fuel_log import FuelLog
from models.expense import Expense


def seed():
    """Run full seed – idempotent (skips if data exists)."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Skip if already seeded
        if db.query(User).count() > 0:
            print("Database already seeded. Skipping.")
            return

        print("Seeding database...")

        users = [
            User(email="fleet@demo.com", hashed_password=hash_password("password123"),
                 full_name="Alex Fleet Manager", role="fleet_manager"),
            User(email="dispatch@demo.com", hashed_password=hash_password("password123"),
                 full_name="Jordan Dispatcher", role="dispatcher"),
            User(email="safety@demo.com", hashed_password=hash_password("password123"),
                 full_name="Sam Safety Officer", role="safety_officer"),
            User(email="finance@demo.com", hashed_password=hash_password("password123"),
                 full_name="Taylor Financial Analyst", role="financial_analyst"),
        ]
        db.add_all(users)
        db.flush()

        vehicles = [
            Vehicle(name="Thunder Hauler", model="Volvo FH16", license_plate="TRK-001",
                    max_capacity=18000, odometer=45200, vehicle_type="Truck",
                    acquisition_cost=95000, status="Available", region="North"),
            Vehicle(name="Swift Carrier", model="Mercedes Actros", license_plate="TRK-002",
                    max_capacity=15000, odometer=32100, vehicle_type="Truck",
                    acquisition_cost=88000, status="Available", region="South"),
            Vehicle(name="City Runner", model="Ford Transit", license_plate="VAN-001",
                    max_capacity=2500, odometer=18300, vehicle_type="Van",
                    acquisition_cost=35000, status="Available", region="East"),
            Vehicle(name="Quick Dash", model="Mercedes Sprinter", license_plate="VAN-002",
                    max_capacity=3000, odometer=22400, vehicle_type="Van",
                    acquisition_cost=38000, status="Available", region="West"),
            Vehicle(name="Flash Rider", model="Honda CB500", license_plate="BKE-001",
                    max_capacity=50, odometer=8200, vehicle_type="Bike",
                    acquisition_cost=8000, status="Available", region="Central"),
            Vehicle(name="Road King", model="Scania R500", license_plate="TRK-003",
                    max_capacity=20000, odometer=67500, vehicle_type="Truck",
                    acquisition_cost=110000, status="Available", region="North"),
            Vehicle(name="Urban Express", model="Renault Master", license_plate="VAN-003",
                    max_capacity=2800, odometer=15600, vehicle_type="Van",
                    acquisition_cost=32000, status="Available", region="Central"),
            Vehicle(name="Old Faithful", model="MAN TGX", license_plate="TRK-004",
                    max_capacity=16000, odometer=120000, vehicle_type="Truck",
                    acquisition_cost=75000, status="Retired", region="South"),
        ]
        db.add_all(vehicles)
        db.flush()

        drivers = [
            Driver(full_name="Marcus Johnson", license_number="DL-1001",
                   license_expiry=date(2027, 6, 15), phone="+1-555-0101",
                   safety_score=95, status="On Duty"),
            Driver(full_name="Elena Rodriguez", license_number="DL-1002",
                   license_expiry=date(2027, 3, 20), phone="+1-555-0102",
                   safety_score=92, status="On Duty"),
            Driver(full_name="David Chen", license_number="DL-1003",
                   license_expiry=date(2026, 12, 1), phone="+1-555-0103",
                   safety_score=88, status="On Duty"),
            Driver(full_name="Sarah Kim", license_number="DL-1004",
                   license_expiry=date(2026, 8, 10), phone="+1-555-0104",
                   safety_score=97, status="On Duty"),
            Driver(full_name="James Wilson", license_number="DL-1005",
                   license_expiry=date(2026, 1, 15), phone="+1-555-0105",
                   safety_score=72, complaints=3, status="On Duty"),
            Driver(full_name="Anna Petrov", license_number="DL-1006",
                   license_expiry=date(2025, 6, 1), phone="+1-555-0106",
                   safety_score=60, complaints=5, status="Suspended"),
        ]
        db.add_all(drivers)
        db.flush()

        now = datetime.now(timezone.utc)
        trips = [
            Trip(vehicle_id=1, driver_id=1, cargo_weight=12000, origin="New York",
                 destination="Boston", distance=350, estimated_fuel_cost=280,
                 revenue=2500, status="Completed", scheduled_date=date(2026, 1, 5),
                 completed_date=now - timedelta(days=45)),
            Trip(vehicle_id=2, driver_id=2, cargo_weight=10000, origin="Chicago",
                 destination="Detroit", distance=450, estimated_fuel_cost=360,
                 revenue=3200, status="Completed", scheduled_date=date(2026, 1, 12),
                 completed_date=now - timedelta(days=38)),
            Trip(vehicle_id=3, driver_id=3, cargo_weight=1800, origin="San Francisco",
                 destination="San Jose", distance=80, estimated_fuel_cost=45,
                 revenue=600, status="Completed", scheduled_date=date(2026, 1, 20),
                 completed_date=now - timedelta(days=30)),
            Trip(vehicle_id=1, driver_id=4, cargo_weight=15000, origin="Philadelphia",
                 destination="Washington DC", distance=230, estimated_fuel_cost=190,
                 revenue=1800, status="Completed", scheduled_date=date(2026, 2, 1),
                 completed_date=now - timedelta(days=18)),
            Trip(vehicle_id=4, driver_id=1, cargo_weight=2200, origin="Seattle",
                 destination="Portland", distance=280, estimated_fuel_cost=120,
                 revenue=950, status="Completed", scheduled_date=date(2026, 2, 5),
                 completed_date=now - timedelta(days=14)),
            # Draft trip
            Trip(vehicle_id=1, driver_id=1, cargo_weight=14000, origin="Atlanta",
                 destination="Miami", distance=0, estimated_fuel_cost=500,
                 revenue=3500, status="Draft", scheduled_date=date(2026, 2, 25)),
        ]
        db.add_all(trips)
        db.flush()

        # Update driver stats for completed trips
        for d in [drivers[0], drivers[1], drivers[2], drivers[3]]:
            d.total_trips = db.query(Trip).filter(Trip.driver_id == d.id).count()
            d.completed_trips = db.query(Trip).filter(Trip.driver_id == d.id, Trip.status == "Completed").count()
            d.completion_rate = round((d.completed_trips / d.total_trips * 100) if d.total_trips > 0 else 0, 2)

        maint_logs = [
            MaintenanceLog(vehicle_id=6, issue="Engine overhaul", description="Complete engine rebuild",
                           date=date(2026, 1, 10), cost=4500, status="In Progress"),
            MaintenanceLog(vehicle_id=3, issue="Brake pad replacement", description="Front and rear brake pads",
                           date=date(2026, 2, 1), cost=350, status="Resolved"),
            MaintenanceLog(vehicle_id=1, issue="Oil change", description="Routine 50K service",
                           date=date(2026, 2, 10), cost=180, status="Resolved"),
        ]
        db.add_all(maint_logs)

        # Set vehicle 6 to In Shop (has open maintenance)
        vehicles[5].status = "In Shop"

        fuel_logs = [
            FuelLog(vehicle_id=1, trip_id=1, date=date(2026, 1, 5), liters=120, cost=264, odometer_reading=45200),
            FuelLog(vehicle_id=2, trip_id=2, date=date(2026, 1, 12), liters=150, cost=330, odometer_reading=32100),
            FuelLog(vehicle_id=3, trip_id=3, date=date(2026, 1, 20), liters=28, cost=62, odometer_reading=18300),
            FuelLog(vehicle_id=1, trip_id=4, date=date(2026, 2, 1), liters=80, cost=176, odometer_reading=45430),
            FuelLog(vehicle_id=4, trip_id=5, date=date(2026, 2, 5), liters=95, cost=209, odometer_reading=22400),
        ]
        db.add_all(fuel_logs)

        expenses = [
            Expense(vehicle_id=1, trip_id=1, category="Tolls", amount=45, date=date(2026, 1, 5)),
            Expense(vehicle_id=2, trip_id=2, category="Parking", amount=30, date=date(2026, 1, 12)),
            Expense(vehicle_id=1, category="Insurance", description="Monthly premium", amount=450, date=date(2026, 1, 1)),
            Expense(vehicle_id=2, category="Insurance", description="Monthly premium", amount=420, date=date(2026, 1, 1)),
            Expense(vehicle_id=3, category="Insurance", description="Monthly premium", amount=200, date=date(2026, 1, 1)),
        ]
        db.add_all(expenses)

        db.commit()
        print("Database seeded successfully!")
        print("\nDemo Accounts:")
        print("  Fleet Manager:     fleet@demo.com / password123")
        print("  Dispatcher:        dispatch@demo.com / password123")
        print("  Safety Officer:    safety@demo.com / password123")
        print("  Financial Analyst: finance@demo.com / password123")

    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
