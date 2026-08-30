# 🔌 Ardhnarishwar SaaS — REST API Specification

**Base URL**: `https://api.ardhnarishwar.ai/api/v1` (Local: `http://localhost:8000/api/v1`)  
**Authentication**: Bearer JWT (`Authorization: Bearer <token>`)

---

## 1. Authentication & Tenant Identity

### `POST /auth/login`
Authenticates a user and returns a scoped JWT token containing user identity and tenant context.
```json
// Request
{
  "email": "admin@cyberdyne.io",
  "password": "SecurePassword123!"
}

// Response (200 OK)
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "usr_cyberdyne_admin",
    "name": "Dr. Miles Bennett",
    "email": "admin@cyberdyne.io",
    "role": "COMPANY_ADMIN",
    "company_id": "comp_cyberdyne"
  }
}
```

---

## 2. In-House AI Evaluation Engine

### `POST /ai-engine/evaluate-answer`
Evaluates candidate answer against benchmark ground truth without external API keys.
```json
// Request
{
  "question_title": "Kinematics & Singularity Avoidance",
  "category": "TECHNICAL",
  "prompt": "Explain the difference between Forward and Inverse Kinematics...",
  "ideal_benchmark_answer": "Forward kinematics computes Cartesian pose...",
  "candidate_transcript": "Forward kinematics uses DH parameters to calculate Cartesian pose from joint angles...",
  "duration_seconds": 30,
  "key_concepts": [
    "Forward Kinematics",
    "Inverse Kinematics",
    "Denavit-Hartenberg",
    "Jacobian Matrix"
  ],
  "anti_patterns": ["Ignoring singularities"]
}

// Response (200 OK)
{
  "score": 88.0,
  "dimension_scores": {
    "relevance": 84.0,
    "technical_depth": 91.0,
    "communication": 100.0,
    "problem_solving": 80.0,
    "confidence": 88.0,
    "role_competency": 88.0
  },
  "identified_concepts": ["Forward Kinematics", "Inverse Kinematics", "Denavit-Hartenberg", "Jacobian Matrix"],
  "missing_concepts": [],
  "wpm": 134,
  "feedback": "Strong conceptual grasp. Covered core principles: Forward Kinematics, Inverse Kinematics, Denavit-Hartenberg.",
  "engine_version": "Ardhnarishwar-Core-AI-v3"
}
```

---

## 3. Smart Attendance SaaS Endpoints

### `POST /attendance/punch-in`
Records a verified attendance check-in with biometric, geofence, or dynamic OTP verification.
```json
// Request
{
  "employee_id": "emp_01",
  "location_id": "loc_sf_hq",
  "method": "CAMERA_FACIAL",
  "device_info": "Chrome 122.0 / macOS (Facial Match 99.4%)",
  "coordinates": {
    "latitude": 37.789170,
    "longitude": -122.396820
  }
}

// Response (201 Created)
{
  "success": true,
  "message": "Check-in recorded successfully via CAMERA_FACIAL!",
  "record": {
    "id": "att_1740718800000",
    "employee_id": "emp_01",
    "attendance_date": "2026-08-28",
    "punch_in_time": "2026-08-28T09:04:15.000Z",
    "status": "PRESENT",
    "is_late": false,
    "late_by_minutes": 0
  }
}
```

### `POST /attendance/punch-out`
Records check-out and computes total work minutes and shift status.
```json
// Request
{
  "employee_id": "emp_01",
  "method": "CAMERA_FACIAL"
}

// Response (200 OK)
{
  "success": true,
  "message": "Checked out successfully! Total work time: 9h 6m",
  "total_work_minutes": 546
}
```

### `GET /attendance/records?limit=50&offset=0&department_id=dept_perception`
Returns paginated, tenant-isolated attendance records.

---

## 4. Reports & Exports

### `GET /reports/attendance/export-csv`
Returns a streamable CSV binary file containing monthly attendance compliance data.

### `GET /reports/candidates/export-csv`
Returns a streamable CSV binary file containing candidate AI evaluation results.
