# 🔐 Security, RBAC, Zero-Trust JWT & Hardened Defense Blueprint

This document details the security posture, Zero-Trust authentication pipeline, anti-spoofing header defenses, and privilege elevation controls implemented in **Ardhnarishwar SaaS**.

---

## 1. Zero-Trust Identity & Authorization Pipeline

1. **Zero Client Header Trust**: The backend **NEVER** trusts client-supplied `X-Actor-Role` or `X-Actor-Company-Id` headers.
2. **Cryptographic Identity Source**: All permissions, tenant scoping, and authorization decisions derive strictly from HMAC-SHA256 verified JWT Bearer tokens and server-side MySQL database records.
3. **Active Header Tampering Rejection**: If an untrusted client passes an `X-Actor-Role` or `X-Actor-Company-Id` header that conflicts with their verified token, the server immediately raises `HTTP 403 Forbidden` and records a critical security audit alert.

---

## 2. Verified Attack Defense Matrix

| Attack Vector | Simulated Attack Payload | Defense Mechanism | Result |
| :--- | :--- | :--- | :---: |
| **Attack 1: Company A User changes Tenant Header** | `Authorization: Bearer <JWT_Comp_A>`<br>`X-Actor-Company-Id: comp_b` | Detected conflicting tenant header against JWT claims. | **BLOCKED (HTTP 403)** |
| **Attack 2: Normal User changes Role to Super Admin** | `Authorization: Bearer <JWT_Recruiter>`<br>`X-Actor-Role: SUPER_ADMIN` | Rejected role header spoofing; validated database role. | **BLOCKED (HTTP 403)** |
| **Attack 3: Candidate changes Role to Company Admin** | `Authorization: Bearer <JWT_Candidate>`<br>`X-Actor-Role: COMPANY_ADMIN` | Blocked privilege escalation attempt; candidate barred. | **BLOCKED (HTTP 403)** |
| **Attack 4: Candidate changes Tenant Header** | `Authorization: Bearer <JWT_Candidate>`<br>`X-Actor-Company-Id: comp_b` | Blocked cross-tenant IDOR manipulation attempt. | **BLOCKED (HTTP 403)** |
| **Attack 5: Missing / Forged JWT with Valid Headers** | `No JWT / Forged Bearer Token`<br>`X-Actor-Role: SUPER_ADMIN` | Header ignored; unauthenticated request rejected. | **BLOCKED (HTTP 401)** |
| **Attack 6: Valid JWT + Conflicting Headers** | `Authorization: Bearer <JWT_Comp_A>`<br>`X-Actor-Role: COMPANY_ADMIN` | Detected discrepancy between JWT role and client header. | **BLOCKED (HTTP 403)** |

---

## 3. Secret Management & Fail-Fast Policy

- **No Hardcoded Defaults in Production**: If `ENVIRONMENT == "production"` and `SECRET_KEY` is missing or less than 32 characters, the backend **fails fast** on startup with `RuntimeError`.
- **Sanitized Placeholders**: `.env.example` contains only non-sensitive template variables.
- **CORS Hardening**: Explicit origin allowlisting without wildcards (`*`) when credentials are enabled.

---

## 4. Active Rate Limiting Protection

- **Login & Auth Endpoints**: Enforces sliding-window limit of 30 req/min per client IP.
- **General Endpoints**: Enforces sliding-window limit of 120 req/min per client IP.
- **Rejection Status**: `HTTP 429 Too Many Requests` with `Retry-After: 60`.
