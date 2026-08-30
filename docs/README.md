# 🤖 Ardhnarishwar Global AI Robotics Interview SaaS Platform

An enterprise-grade, multi-tenant B2B SaaS platform for automated, AI-driven candidate technical and behavioral interviewing. Built for autonomous systems, robotics, control theory, and high-performance software engineering hiring.

---

## 🌟 Core Platform Highlights

- **👑 Ardhnarishwar Super Admin Control Center**: Multi-tenant company provisioning, global candidate telemetry, AI hyperparameter tuning, model version registry, and immutable audit logging.
- **🏢 Company Admin & Recruiter Workspace**: Multi-stage interview round setup (AI Screening, Technical Robotics, Behavioral STAR), job position manager, and real-time candidate pipeline tracking.
- **🎙️ Candidate Live Interview Chamber**: Hardware pre-flight diagnostics (1080p camera check + Web Audio API VU-meter), animated robotic interviewer avatar, speech-to-text transcription, and WebRTC timestamped video recording.
- **🧠 Internally Controlled Core-AI Engine**: Strictly zero reliance on third-party generative AI APIs (no OpenAI, Gemini, Claude, or Grok). Evaluates responses using Scikit-Learn TF-IDF cosine similarity, domain concept graph matching, speech fluency/WPM pacing, and STAR behavioral heuristics.
- **🗄️ MySQL 8.0 & SQLAlchemy 2.0 ORM**: Connection pooling (`pool_size=20`, `pool_recycle=1800`), cascading foreign keys across 13 relational tables, and eager-loaded joined queries.
- **🔐 Zero-Trust Cryptographic Security**: HMAC-SHA256 JWT Bearer authentication, anti-header-spoofing defense guards, active sliding-window rate limiting, and authorized Super Admin impersonation.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, WebRTC, Web Audio API, Web Speech API
- **Backend**: Python 3.11/3.14, FastAPI, SQLAlchemy 2.0, PyMySQL, Pydantic v2, PyJWT, Alembic, Scikit-Learn, NumPy, Pandas
- **Database**: MySQL 8.0 with InnoDB Engine & Connection Pooling
- **Storage**: Tenant-isolated file vaults with 15-minute HMAC-SHA256 presigned streaming tokens
- **DevOps**: Docker, Docker Compose, Nginx Reverse Proxy

---

## 🧪 Verification Commands

```bash
# 1. Production Frontend Build
npm run build

# 2. AI Model Versioning & Historical Reproducibility Test
npx tsx test_ai_versioning_reproducibility.ts

# 3. Zero-Trust JWT & Actor Header Penetration Test
backend\.venv\Scripts\python.exe backend\test_jwt_security_attacks.py

# 4. Multi-Tenant Cross-Tenant Penetration Test
backend\.venv\Scripts\python.exe backend\audit_cross_tenant_deep.py

# 5. Recording Lifecycle & Presigned Streaming Security Test
backend\.venv\Scripts\python.exe backend\test_recording_lifecycle.py

# 6. Live SQLAlchemy ORM Runtime Test
backend\.venv\Scripts\python.exe backend\test_sqlalchemy_live.py
```
