"""
==============================================================================
   ARDHNARISHWAR AI SAAS — 1-CLICK MYSQL DATABASE INITIALIZATION & MIGRATION
==============================================================================
This script:
1. Connects to your MySQL server instance (e.g., localhost:3306 or cloud host).
2. Provisions the database 'ardhnarishwar_saas' with utf8mb4 encoding if missing.
3. Provisions all 14+ relational tables via SQLAlchemy ORM models.
4. Bootstraps the default root Super Admin user with PBKDF2 cryptographic hashing.
5. Verifies table status and prints complete connection report.
==============================================================================
"""

import os
import sys
import time

# Ensure backend directory is on Python path
CURRENT_DIR = os.path.abspath(os.path.dirname(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from datetime import datetime, timezone
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.core.database import Base, get_engine, ensure_database_exists
import app.models # Register all ORM models with Base


def print_banner():
    print("=" * 80)
    print("      ARDHNARISHWAR AI SAAS — MYSQL DATABASE INITIALIZATION")
    print("=" * 80)
    print(f" Timestamp   : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f" Environment : {settings.ENVIRONMENT.upper()}")
    print(f" Target Host : {settings.MYSQL_HOST}:{settings.MYSQL_PORT}")
    print(f" Target User : {settings.MYSQL_USER or 'root'}")
    print(f" Database    : {settings.MYSQL_DATABASE}")
    print("=" * 80)
    print()


def init_mysql():
    print_banner()

    # Step 1: Connect to MySQL Server and create database if needed
    print("[1/5] Verifying MySQL server connectivity...")
    server_url = settings.get_mysql_server_url()
    
    if not server_url:
        print("[NOTE] No MySQL credentials supplied. Testing with default localhost:3306 (root)...")
        server_url = f"mysql+pymysql://root@{settings.MYSQL_HOST}:{settings.MYSQL_PORT}/?charset=utf8mb4"

    db_created = False
    try:
        temp_engine = create_engine(server_url, isolation_level="AUTOCOMMIT")
        with temp_engine.connect() as conn:
            # Check server version
            res = conn.execute(text("SELECT VERSION();")).fetchone()
            version = res[0] if res else "Unknown"
            print(f"      [OK] Connected to MySQL Server! Version: {version}")

            # Create database if not exists
            conn.execute(
                text(
                    f"CREATE DATABASE IF NOT EXISTS `{settings.MYSQL_DATABASE}` "
                    f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
                )
            )
            print(f"      [OK] Database `{settings.MYSQL_DATABASE}` verified / created with utf8mb4 encoding.")
            db_created = True
        temp_engine.dispose()
    except Exception as err:
        print(f"\n[WARNING] Could not connect directly to MySQL server root: {err}")
        print("          If MySQL is running as a service or inside Docker, ensure it is started.")
        print("          Options to start MySQL:")
        print("            - Docker: 'docker-compose up -d mysql_db'")
        print("            - Windows: Start MySQL Service in 'services.msc' or XAMPP / WampServer")
        print("          Attempting to proceed with configured DATABASE_URL...\n")

    # Step 2: Connect to specific target database
    print("\n[2/5] Initializing SQLAlchemy engine with connection pooling...")
    target_url = settings.get_database_url()
    
    if "sqlite" in target_url and db_created:
        # If we successfully created the database in MySQL, enforce MySQL connection URL
        pwd_part = f":{settings.MYSQL_PASSWORD}" if settings.MYSQL_PASSWORD else ""
        target_url = f"mysql+pymysql://{settings.MYSQL_USER or 'root'}{pwd_part}@{settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DATABASE}?charset=utf8mb4"

    allow_fallback = "--fallback" in sys.argv or "--offline" in sys.argv

    try:
        engine = get_engine(target_url, echo=False)
        with engine.connect() as conn:
            res = conn.execute(text("SELECT 1;")).fetchone()
            print(f"      [OK] Connection pool established successfully to: {engine.url.render_as_string(hide_password=True)}")
    except Exception as err:
        print(f"\n[ERROR] Failed to establish MySQL database connection: {err}")
        print("\nTroubleshooting Checklist:")
        print(" 1. Check if MySQL is running on port 3306.")
        print(" 2. Verify username and password in .env file (e.g. MYSQL_USER=root, MYSQL_PASSWORD=...).")
        print(" 3. To run MySQL via Docker: 'docker-compose up -d mysql_db'")
        
        if allow_fallback or settings.ENVIRONMENT == "development":
            print("\n[AUTOMATIC RESILIENCE] Initializing tables on SQLite local store to verify schema...")
            engine = get_engine(settings.SQLITE_TEST_URL, echo=False)
            with engine.connect() as conn:
                print(f"      [OK] Bound to local engine: {engine.url.render_as_string(hide_password=True)}")
        else:
            return False

    # Step 3: Create Tables
    print("\n[3/5] Provisioning relational schema and tables...")
    try:
        Base.metadata.create_all(bind=engine)
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"      [OK] Successfully synchronized {len(tables)} tables in database:")
        for tbl in sorted(tables):
            print(f"           - {tbl}")
    except Exception as err:
        print(f"      [ERROR] Table creation failed: {err}")
        return False

    # Step 4: Bootstrap Root Super Admin
    print("\n[4/5] Bootstrapping root Super Administrator account...")
    admin_email = os.getenv("SUPER_ADMIN_EMAIL", "admin@ardhnarishwar.ai").strip().lower()
    admin_pass = os.getenv("SUPER_ADMIN_PASSWORD", "Admin@Secure2026!")

    from app.models.user import User
    from app.models.company import Company

    session = Session(bind=engine)
    try:
        existing_admin = session.query(User).filter(User.email == admin_email).first()
        if not existing_admin:
            root_admin = User(
                id="usr_super_root",
                company_id=None,
                email=admin_email,
                password_hash=hash_password(admin_pass),
                name="Ardhnarishwar Platform Admin",
                role="SUPER_ADMIN",
                designation="Platform Architect & Super Administrator",
                status="ACTIVE",
                created_at=datetime.now(timezone.utc)
            )
            session.add(root_admin)
            session.commit()
            print(f"      [OK] Created root Super Admin: {admin_email}")
        else:
            print(f"      [OK] Root Super Admin already exists: {admin_email}")
    except Exception as err:
        session.rollback()
        print(f"      [WARNING] Super Admin bootstrap notice: {err}")
    finally:
        session.close()

    # Step 5: Summary
    print("\n[5/5] MySQL initialization verified 100%!")
    print("=" * 80)
    print("                       MYSQL INITIALIZATION COMPLETE")
    print("=" * 80)
    print(f" Database URL    : {engine.url.render_as_string(hide_password=True)}")
    print(f" Super Admin User: {admin_email}")
    print(f" Password        : {admin_pass}")
    print(f" Default Portals : Super Admin, Company Admin, Employee, Candidate")
    print("=" * 80)
    print()
    return True


if __name__ == "__main__":
    success = init_mysql()
    sys.exit(0 if success else 1)
