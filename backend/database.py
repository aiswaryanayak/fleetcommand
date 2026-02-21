"""
Database engine & session factory.
Supports SQLite (local dev / hackathon) and PostgreSQL (production).
Automatically configures connection args based on the DATABASE_URL scheme.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import DATABASE_URL

# ── Detect database backend ──────────────────────────────────────────────────
_is_sqlite = DATABASE_URL.startswith("sqlite")

# ── Engine ────────────────────────────────────────────────────────────────────
_connect_args = {"check_same_thread": False} if _is_sqlite else {}
engine = create_engine(
    DATABASE_URL,
    connect_args=_connect_args,
    pool_pre_ping=True,  # auto-reconnect stale connections
    echo=False,
)


# ── Enable foreign key enforcement for SQLite ────────────────────────────────
if _is_sqlite:
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        """SQLite ignores FK constraints by default. This enables them."""
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


# ── Session factory ──────────────────────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── Declarative base for models ──────────────────────────────────────────────
Base = declarative_base()


def get_db():
    """FastAPI dependency – yields a DB session and ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
