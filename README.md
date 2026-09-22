# 🤖 Ardhnarishwar AI SaaS — 100% Real-Time Production Platform

An enterprise-grade, multi-tenant B2B AI Interview & HRMS SaaS platform. Features autonomous AI candidate evaluations, live video recording, resume management vault, and support for both **Skilled Technical Candidates** and **Unskilled / General Workforce Applicants**.

---

## ⚡ 1-Click Fast Launchers (Zero Setup)

| Script | Purpose |
|---|---|
| 🚀 **`START_APPLICATION.bat`** | **Single 1-Click Launcher**: Verifies MySQL database, starts FastAPI backend (`8000`), Vite frontend (`5173`), opens browser, and creates public HTTPS tunnel. |
| 🗄️ **`INIT_MYSQL.bat`** | **1-Click MySQL Initializer**: Provisions `ardhnarishwar_saas` database, verifies server connection, syncs all 14+ ORM tables, and creates default Super Admin. |
| 🌐 **`run_public_url.bat`** | Launches the full-stack app with an instant global HTTPS tunnel via `localtunnel`. |
| ☁️ **`sync_and_deploy.bat`** | Verifies builds, auto-stages changes, commits, and pushes to GitHub to trigger Vercel/Netlify/Render auto-deployment. |

---

## 🌟 Core Features & Modules

### 1. 🛠️ Skilled vs. 👷 Unskilled / General Workforce System
- **Skilled Professionals** (Robotics, AI, Software, Systems, Management):
  - In-depth technical assessments (ROS2, SLAM, Python, C++, Kinematics).
  - Code syntax checking, domain concept graph matching, STAR behavioral heuristics.
- **Unskilled & General Workforce** (Assembly Operators, Logistics, Helpers, Trainees):
  - Streamlined application (Name, Phone, Trade/Experience).
  - Practical aptitude, workplace safety protocols, teamwork reliability, and verbal clarity evaluations without unfair technical algorithm penalties.
- **Recruiter & Job Management**:
  - Filter and tag jobs and candidates by skill category (`SKILLED`, `UNSKILLED`, `SEMI_SKILLED`).

### 2. 📄 Production Resume Vault
- Multipart file upload (PDF, DOC, DOCX up to 10MB) with cryptographic storage.
- Auto-linked to candidate applications, company tenants, and interview dossiers.
- Dedicated Super Admin & Candidate management interfaces with streaming download and deletion.

### 3. 🧠 In-House Core-AI Evaluation Engine
- **Zero reliance on third-party paid APIs** (No OpenAI, Gemini, or Claude dependencies).
- TF-IDF vectorizer + concept graph evaluator + speech fluency WPM calculator.
- Deterministic SHA-256 reproducibility hashes for compliance and auditability.

### 4. 👑 Super Admin & Company Admin Workspaces
- Super Admin console for multi-tenant company provisioning, resume vault audit, and AI hyperparameter tuning.
- Recruiter workspaces with interview round builders, candidate pipeline boards, and automated scorecard generation.

---

## 🚀 Quick Start (Manual)

### Database (MySQL 8.0):
```bash
# 1-Click Setup (Windows):
INIT_MYSQL.bat

# Or manual Python script:
backend\.venv\Scripts\python.exe backend/init_mysql.py

# Or start containerized MySQL:
docker compose up -d mysql_db
```
*Note: If local MySQL service is not yet started during development, the backend automatically logs a warning and uses a local SQLite fallback (`ardhnarishwar_local.db`) so your workflow is never interrupted.*

### Backend (FastAPI):
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows (.venv/bin/activate on Linux/macOS)
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation: `http://localhost:8000/docs`

### Frontend (React + Vite + TypeScript):
```bash
npm install
npm run dev
```
Access Frontend: `http://localhost:5173`

---

## 🧪 Automated Test Suite

```bash
# 1. Frontend Build & TypeScript Typecheck
npm run build

# 2. End-to-End Production Flow Integration Test
backend\.venv\Scripts\python.exe backend/test_e2e_production_flow.py

# 3. Skilled vs. Unskilled Pipeline Test
backend\.venv\Scripts\python.exe backend/test_skilled_unskilled_flow.py

# 4. Zero-Trust Security & JWT Attack Test
backend\.venv\Scripts\python.exe backend/test_jwt_security_attacks.py
```

---

## 🌐 Production Deployment Guides

### Docker & Docker Compose
```bash
docker compose up --build -d
```

### Vercel / Netlify / Render
- **Frontend**: Connect repository to Vercel or Netlify with root build command `npm run build` and output `dist`.
- **Backend**: Deploy `backend/` directory to Render / Railway / Fly.io using `render.yaml` or `Procfile`.
- **Set Environment Variables**: Set `VITE_API_URL` on frontend to point to your live backend domain.
