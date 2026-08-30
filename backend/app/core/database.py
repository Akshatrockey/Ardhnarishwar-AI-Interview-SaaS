"""
Ardhnarishwar SaaS - SQLAlchemy Engine & Session Factory
Handles database engine creation, connection pooling, session lifecycle, and base declarations.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from typing import Generator
import logging
from .config import settings

logger = logging.getLogger(__name__)

def get_engine(database_url: str = None, echo: bool = False):
    """
    Constructs an optimized SQLAlchemy engine with connection pooling and MySQL keep-alive.
    """
    url = database_url or settings.get_database_url()
    
    if url.startswith("sqlite"):
        # SQLite configuration for local testing
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
            echo=echo or settings.DB_ECHO_SQL
        )
    
    # Production MySQL Engine with connection pooling
    return create_engine(
        url,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT,
        pool_recycle=settings.DB_POOL_RECYCLE,
        pool_pre_ping=True,  # Tests connection liveness before checking out of pool
        echo=echo or settings.DB_ECHO_SQL
    )

# Primary Engine Instance
engine = get_engine()

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
