# 🏛️ Ardhnarishwar AI Interview SaaS — Production System Architecture

**Platform Identity**: Ardhnarishwar Autonomous Robotics & Systems Interview SaaS  
**Architecture Style**: Multi-Tenant Tier-4 Zero-Trust SaaS with In-House Scikit-Learn NLP Engine

---

## 1. High-Level System Architecture

```
                               ┌────────────────────────────────────────┐
                               │       Client Browser / WebRTC          │
                               │  (React 18 + TypeScript + Vanilla CSS) │
                               └──────────────────┬─────────────────────┘
                                                  │ (HTTPS / Bearer JWT)
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │           Nginx Reverse Proxy          │
                               │   - Security Headers (CSP, HSTS)       │
                               │   - Gzip Compression & Static Cache    │
                               │   - SPA Routing Fallback               │
                               └──────────────────┬─────────────────────┘
                                                  │ (Reverse Proxy :8000)
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │        FastAPI Application Core        │
                               │   - Zero-Trust JWT Authentication      │
                               │   - Active Sliding-Window Rate Limiter │
                               │   - Anti-Header-Spoofing Guard         │
                               │   - Role-Based Access Control (RBAC)   │
                               └───────┬────────────────────┬───────────┘
                                       │                    │
              ┌────────────────────────┴────────┐  ┌────────┴────────────────────────┐
              ▼                                 ▼  ▼                                 ▼
┌───────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
│ In-House Core-AI Engine   │    │ SQLAlchemy 2.0 ORM Engine │    │ Secure Recording Storage  │
│ - TF-IDF Vectorizer       │    │ - Connection Pool (20/10) │    │ - Isolated Tenant Vaults  │
│ - Concept Graph Traversal │    │ - Pre-Ping & Auto-Recycle │    │ - HMAC-SHA256 Signed URLs │
│ - STAR Behavioral Heuristics │ │ - Cascading Foreign Keys  │    │ - HTTP 206 Partial Stream │
│ - Model Version Registry  │    │ - MySQL 8.0 Database      │    │ - SHA-256 Checksums       │
└───────────────────────────┘    └───────────────────────────┘    └───────────────────────────┘
```

---

## 2. Multi-Tenant Logical Partitioning & Isolation

1. **Logical Partitioning**: Every primary business entity (`jobs`, `interview_rounds`, `candidates`, `interview_sessions`, `audit_logs`) contains a mandatory, indexed foreign key `company_id`.
2. **Zero-Trust Query Scoping**: All tenant CRUD methods strictly filter by `where(Model.company_id == jwt.company_id)`. Untrusted client headers are barred from influencing tenant resolution.
3. **Super Admin Global Authority**: The Ardhnarishwar Super Admin operates with cross-tenant observability for billing, audit compliance, and system health.

---

## 3. Database Schema & Index Topology (MySQL 8.0)

- **13 Relational Tables**: `companies`, `subscriptions`, `users`, `audit_logs`, `jobs`, `interview_rounds`, `question_banks`, `round_questions`, `candidates`, `interview_sessions`, `candidate_answers`, `ai_evaluation_reports`, `ai_model_versions`.
- **Composite Indexes**:
  - `idx_candidates_company_job`: `(company_id, job_id)`
  - `idx_sessions_company_status`: `(company_id, status)`
  - `idx_answers_session`: `(session_id)`
  - `idx_audit_company_date`: `(company_id, created_at)`
  - `idx_aiv_active`: `(is_active)`
- **Cascade Deletions**: Deleting a company or job cascades cleanly to all associated rounds, sessions, and scorecards.

---

## 4. In-House AI Model Versioning & Dataset Registry

- **Zero 3rd-Party API Dependency**: Internally controlled AI/NLP evaluation engine with zero dependency on third-party generative AI APIs (no OpenAI, Gemini, Claude, or Grok).
- **Auditable Version Artifacts**: Every AI version records `id`, `version_tag`, `dataset_ref`, `dataset_checksum`, `scoring_config`, `feature_config`, `rule_config`, and `evaluation_metrics`.
- **Deterministic Reproducibility**: Evaluations store `model_version_snapshot` and a cryptographic `reproducibility_hash`. Historical evaluations are 100% reproducible when re-evaluated under their original snapshot.

---

## 5. Audit Logging Immutability & Retention Strategy

- **Immutability Principle**: Audit log records are strictly **Append-Only (INSERT-only)**. No application flow permits `UPDATE` or `DELETE` on the `audit_logs` table.
- **Hot Tier Retention**: Stored in MySQL for 90 days with composite index on `(company_id, created_at)`.
- **Cold Tier Archival**: After 90 days, automated cron dumps log batches to immutable WORM (Write Once, Read Many) S3 Object Lock storage.
