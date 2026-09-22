"""
Ardhnarishwar SaaS - Secure Database, Secret & Environment Configuration
Hardened for Zero-Trust & Production Deployments.
"""
import os
import sys
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PLATFORM_NAME: str = "Ardhnarishwar AI Interview SaaS"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development").lower()
    
    # Secret Key (Mandatory in production)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # MySQL Database Connection Settings
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", 3306))
    MYSQL_USER: str = os.getenv("MYSQL_USER", "")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "ardhnarishwar_saas")
    
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL", None)
    
    # Local fallback for tests/offline evaluation
    SQLITE_TEST_URL: str = "sqlite:///./ardhnarishwar_local.db"
    
    # Connection Pool Settings
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", 20))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", 10))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", 30))
    DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", 1800))
    DB_ECHO_SQL: bool = os.getenv("DB_ECHO_SQL", "False").lower() in ("true", "1")

    # Rate Limiting Parameters (Requests per minute per client IP)
    RATE_LIMIT_LOGIN_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_LOGIN_PER_MINUTE", 30))
    RATE_LIMIT_API_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_API_PER_MINUTE", 120))

    # CORS Allowed Origins
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    )
    ALLOWED_ORIGINS_RAW: Optional[str] = None

    def get_allowed_origins(self) -> List[str]:
        """
        Parses and sanitizes comma-separated allowed origins.
        Never allows wildcard '*' with credentials.
        """
        raw = (self.ALLOWED_ORIGINS or self.ALLOWED_ORIGINS_RAW or "").strip()
        if not raw:
            return ["http://localhost:5173", "http://127.0.0.1:5173"]
        origins = [origin.strip() for origin in raw.split(",") if origin.strip() and origin.strip() != "*"]
        return origins

    def get_database_url(self) -> str:
        """
        Constructs database URL securely prioritizing MySQL (supporting passwordless root)
        or falls back to SQLite for local offline tests.
        """
        if self.DATABASE_URL:
            return self.DATABASE_URL
        if self.MYSQL_USER:
            password_part = f":{self.MYSQL_PASSWORD}" if self.MYSQL_PASSWORD else ""
            return f"mysql+pymysql://{self.MYSQL_USER}{password_part}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}?charset=utf8mb4"
        return self.SQLITE_TEST_URL

    def get_mysql_server_url(self) -> Optional[str]:
        """
        Returns connection string to the MySQL server instance without a database selected,
        enabling automated database provisioning (CREATE DATABASE IF NOT EXISTS).
        """
        if self.MYSQL_USER:
            password_part = f":{self.MYSQL_PASSWORD}" if self.MYSQL_PASSWORD else ""
            return f"mysql+pymysql://{self.MYSQL_USER}{password_part}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/?charset=utf8mb4"
        return None

    def validate_production_secrets(self) -> None:
        """
        FAIL-FAST CHECK: Ensures required secrets exist when running in production mode.
        """
        if self.ENVIRONMENT in ("production", "prod", "staging"):
            if not self.SECRET_KEY or len(self.SECRET_KEY) < 32:
                raise RuntimeError(
                    "FATAL CONFIG ERROR: SECRET_KEY environment variable is missing or less than 32 characters in production mode."
                )
            if not self.MYSQL_PASSWORD and not self.DATABASE_URL:
                raise RuntimeError(
                    "FATAL CONFIG ERROR: MYSQL_PASSWORD or DATABASE_URL environment variable is required in production mode."
                )

    class Config:
        case_sensitive = False
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Development Fallback Secret if in local dev
if not settings.SECRET_KEY and settings.ENVIRONMENT == "development":
    settings.SECRET_KEY = "dev_only_ephemeral_insecure_jwt_signing_key_for_local_testing_2026"

# Validate production requirements immediately on module import
settings.validate_production_secrets()
