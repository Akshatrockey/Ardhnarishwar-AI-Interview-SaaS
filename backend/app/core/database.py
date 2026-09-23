"""
Ardhnarishwar SaaS - SQLAlchemy Engine & Session Factory
Handles database engine creation, connection pooling, session lifecycle, and base declarations.
Fully configured for MySQL 8.0+ with utf8mb4 collation and automated database provisioning.
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from typing import Generator, Optional
import logging
from .config import settings

logger = logging.getLogger(__name__)

def ensure_database_exists(server_url: Optional[str] = None, database_name: Optional[str] = None) -> bool:
    """
    Attempts to connect to the MySQL server and execute CREATE DATABASE IF NOT EXISTS.
    Returns True if successful, False if server is unreachable.
    """
    srv_url = server_url or settings.get_mysql_server_url()
    db_name = database_name or settings.MYSQL_DATABASE

    if not srv_url:
        return False

    try:
        temp_engine = create_engine(srv_url, isolation_level="AUTOCOMMIT")
        with temp_engine.connect() as conn:
            conn.execute(
                text(
                    f"CREATE DATABASE IF NOT EXISTS `{db_name}` "
                    f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
                )
            )
        temp_engine.dispose()
        logger.info(f"[DATABASE] Verified / Created MySQL database '{db_name}' successfully.")
        return True
    except Exception as err:
        logger.warning(f"[DATABASE] Could not auto-create MySQL database '{db_name}': {err}")
        return False

def get_engine(database_url: Optional[str] = None, echo: bool = False):
    """
    Constructs an optimized SQLAlchemy engine with connection pooling and MySQL keep-alive.
    If MySQL server is unreachable and in development mode, automatically falls back to SQLite.
    """
    url = database_url or settings.get_database_url()

    if url.startswith("sqlite"):
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
            echo=echo or settings.DB_ECHO_SQL
        )

    # Check MySQL server liveness before pool creation
    if "mysql" in url:
        server_ok = ensure_database_exists()
        if not server_ok and settings.ENVIRONMENT in ("development", "test", "dev"):
            logger.warning(
                "[DATABASE] MySQL server is offline or unreachable on configured port. "
                "Resiliently falling back to local SQLite database (ardhnarishwar_local.db)."
            )
            return create_engine(
                settings.SQLITE_TEST_URL,
                connect_args={"check_same_thread": False},
                echo=echo or settings.DB_ECHO_SQL
            )

    # Production MySQL Engine with enterprise connection pooling
    try:
        return create_engine(
            url,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_timeout=settings.DB_POOL_TIMEOUT,
            pool_recycle=settings.DB_POOL_RECYCLE,
            pool_pre_ping=True,  # Tests connection liveness before checking out of pool
            echo=echo or settings.DB_ECHO_SQL
        )
    except Exception as e:
        if settings.ENVIRONMENT in ("development", "test", "dev"):
            logger.warning(f"[DATABASE] MySQL engine creation failed: {e}. Falling back to SQLite.")
            return create_engine(
                settings.SQLITE_TEST_URL,
                connect_args={"check_same_thread": False},
                echo=echo or settings.DB_ECHO_SQL
            )
def auto_migrate_schema(target_engine):
    """Safely adds missing columns to existing SQLite / MySQL tables."""
    new_cols = [
        ("legal_name", "VARCHAR(255)"),
        ("display_name", "VARCHAR(255)"),
        ("favicon_url", "TEXT"),
        ("brand_accent_color", "VARCHAR(32) DEFAULT '#06B6D4'"),
        ("website", "VARCHAR(255)"),
        ("tax_id", "VARCHAR(100)"),
        ("company_size", "VARCHAR(50) DEFAULT '51-200 employees'"),
        ("description", "TEXT"),
        ("hq_street", "VARCHAR(255)"),
        ("hq_city", "VARCHAR(100)"),
        ("hq_state", "VARCHAR(100)"),
        ("hq_country", "VARCHAR(100)"),
        ("hq_postal_code", "VARCHAR(50)"),
        ("phone", "VARCHAR(50)"),
        ("support_email", "VARCHAR(255)"),
        ("timezone", "VARCHAR(100) DEFAULT 'UTC'"),
        ("currency", "VARCHAR(20) DEFAULT 'USD'"),
        ("date_format", "VARCHAR(50) DEFAULT 'YYYY-MM-DD'"),
        ("work_week", "VARCHAR(100) DEFAULT 'Monday - Friday'"),
        ("social_links", "TEXT"),
        ("data_retention_days", "INTEGER DEFAULT 365"),
        ("default_permissions", "TEXT"),
        ("security_contact_email", "VARCHAR(255)"),
        ("settings_metadata", "TEXT"),
    ]
    job_cols = [
        ("requirements", "TEXT"),
        ("ctc", "VARCHAR(100) DEFAULT '$120k - $160k / ₹18 - 25 LPA'"),
        ("deadline", "VARCHAR(100)"),
    ]
    try:
        with target_engine.connect() as conn:
            for col_name, col_type in new_cols:
                try:
                    conn.execute(text(f"ALTER TABLE companies ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                except Exception:
                    pass
            for col_name, col_type in job_cols:
                try:
                    conn.execute(text(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                except Exception:
                    pass
    except Exception:
        pass

# Primary Engine Instance
engine = get_engine()
auto_migrate_schema(engine)

# Session Factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Declarative Base for ORM Models
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields an isolated database session per request,
    guaranteeing rollback on error and proper closure.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        logger.error(f"Database session error: {str(e)}")
        raise
    finally:
        db.close()
