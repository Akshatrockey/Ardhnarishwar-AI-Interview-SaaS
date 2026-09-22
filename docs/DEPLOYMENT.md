# 🚀 Production Deployment & Operational Runbook

This guide covers running **Ardhnarishwar AI Interview SaaS** in local development, testing, containerized Docker, and production enterprise Kubernetes environments.

---

## 1. Development vs Production Configuration

| Component | Local Development Mode | Strict Production Mode |
| :--- | :--- | :--- |
| **ENVIRONMENT** | `development` | `production` |
| **SECRET_KEY** | Ephemeral local fallback allowed | **Mandatory >= 32-char key (Fails Fast if missing)** |
| **Database** | SQLite or Local MySQL | **MySQL 8.0 with Connection Pooling (20/10)** |
| **CORS Origins** | `http://localhost:5173`, `http://localhost:3000` | **Strict Verified Domains (e.g. `https://app.ardhnarishwar.ai`)** |
| **Rate Limiting** | Active (30 login / 120 API per min) | **Active (30 login / 120 API per min) / Redis Adapter** |
| **API Docs (/docs)** | Enabled (Swagger UI) | **Disabled / Protected behind Admin Gateway** |
| **Video Storage** | Local Isolated Directory (`/storage/recordings`) | **Mounted SAN Volume or AWS S3 / MinIO Object Vault** |
| **HTTPS / Proxy** | Direct Vite Dev Server | **Nginx Reverse Proxy with TLS 1.3 & HSTS** |

---

## 2. Running Locally (Development Mode)

### Step 0: Database Provisioning (MySQL 8.0)
Ensure MySQL is running (via local service or Docker `docker compose up -d mysql_db`), then initialize the database and tables:
```bash
# 1-Click Batch (Windows):
INIT_MYSQL.bat

# Or direct Python command:
backend\.venv\Scripts\python.exe backend\init_mysql.py
```
*Note: In development mode, if local MySQL service is offline, the backend automatically falls back to an isolated SQLite file (`ardhnarishwar_local.db`) so developers can continue without blocking.*

### Step 1: Frontend Dev Server
```bash
npm install
npm run dev
# Running at http://localhost:5173/
```

### Step 2: Backend API Server
```bash
cd backend
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\uvicorn main:app --reload --port 8000
# Running at http://localhost:8000/
```

---

## 3. Containerized Deployment (Docker Compose)

### Step 1: Configure Environment
Copy `.env.example` to `.env` and fill in generated secrets:
```bash
cp .env.example .env
```

### Step 2: Build and Start Containers
```bash
docker compose build
docker compose up -d
```

### Step 3: Verify Container Health
```bash
docker compose ps
curl -f http://localhost:8000/health
```

---

## 4. Production Database Migrations (Alembic)

To apply the latest relational schema migrations to MySQL:
```bash
cd backend
.venv\Scripts\alembic upgrade head
```

---

## 5. Automated Verification Test Matrix

```bash
# Frontend Build Verification
npm run build

# AI Model Versioning & Historical Reproducibility
npx tsx test_ai_versioning_reproducibility.ts

# In-House Core-AI Evaluation Engine
npx tsx test_ai_engine.ts

# Persona Security & Privilege Escalation Defenses
npx tsx test_persona_security.ts

# Zero-Trust JWT & Actor Header Penetration Test
backend\.venv\Scripts\python.exe backend\test_jwt_security_attacks.py

# Multi-Tenant Data Isolation & SQLi Penetration Test
backend\.venv\Scripts\python.exe backend\audit_cross_tenant_deep.py

# Recording Lifecycle & Presigned Streaming Security Test
backend\.venv\Scripts\python.exe backend\test_recording_lifecycle.py

# Live SQLAlchemy 2.0 ORM Runtime Test
backend\.venv\Scripts\python.exe backend\test_sqlalchemy_live.py
```
