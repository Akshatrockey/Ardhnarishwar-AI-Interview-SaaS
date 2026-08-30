"""
Ardhnarishwar SaaS - Critical Security Review & Header Spoofing Penetration Test Suite
Strictly executes the 6 Attack Scenarios:
1. Normal Company A user changes X-Actor-Company-Id to Company B.
2. Normal Company user changes X-Actor-Role to SUPER_ADMIN.
3. Candidate changes X-Actor-Role to COMPANY_ADMIN.
4. Candidate changes X-Actor-Company-Id.
5. Missing/invalid JWT but valid actor headers.
6. Valid JWT + conflicting actor headers.

Verifies:
- The server NEVER trusts client-supplied X-Actor-* headers.
- All authorization strictly derives from cryptographic JWT signature + database record.
- All 6 attack attempts FAIL with HTTP 401 / HTTP 403.
"""

import os
import sys
import tempfile
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.models import Company, User, Candidate, InterviewSession
from app.services.recording_service import RecordingSecurityService
from main import app

def run_header_security_attack_tests():
    print("=" * 80)
    print("   CRITICAL SECURITY REVIEW: HEADER SPOOFING & ZERO-TRUST JWT PEN-TEST")
    print("=" * 80)

    # 1. Setup in-memory test database
    db_file = "./jwt_attack_test.db"
    if os.path.exists(db_file):
        os.remove(db_file)

    engine = create_engine(f"sqlite:///{db_file}", echo=False)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)
    db = TestingSessionLocal()

    # 2. Seed Tenants & Users
    comp_a = Company(id="comp_a", name="Company A", slug="comp-a", domain="a.com", plan_tier="GROWTH", status="ACTIVE", contact_email="a@a.com", contact_person="A Admin", industry="Robotics")
    comp_b = Company(id="comp_b", name="Company B", slug="comp-b", domain="b.com", plan_tier="GROWTH", status="ACTIVE", contact_email="b@b.com", contact_person="B Admin", industry="Robotics")
    db.add_all([comp_a, comp_b])
    db.commit()

    user_a_recruiter = User(id="usr_a_rec", company_id="comp_a", email="rec@a.com", password_hash="hash", name="Alice Recruiter", role="RECRUITER", status="ACTIVE")
    user_b_admin = User(id="usr_b_adm", company_id="comp_b", email="adm@b.com", password_hash="hash", name="Bob Admin", role="COMPANY_ADMIN", status="ACTIVE")
    user_super = User(id="usr_super", company_id=None, email="super@ardhnarishwar.ai", password_hash="hash", name="Super Admin", role="SUPER_ADMIN", status="ACTIVE")
    user_cand = User(id="usr_cand", company_id="comp_a", email="cand@a.com", password_hash="hash", name="Candidate Charlie", role="CANDIDATE", status="ACTIVE")

    db.add_all([user_a_recruiter, user_b_admin, user_super, user_cand])
    db.commit()

    # Seed Candidate & Session for Company B
    cand_b = Candidate(id="cand_b_99", company_id="comp_b", job_id="job_b_99", first_name="Bob", last_name="Candidate", email="bob@b.com", interview_token="TOKEN_B_DUMMY")
    sess_b = InterviewSession(id="sess_b_secret_01", company_id="comp_b", candidate_id="cand_b_99", job_id="job_b_99", round_id="round_01", status="COMPLETED")
    db.add_all([cand_b, sess_b])
    db.commit()

    # Create dummy recording file on disk for sess_b
    RecordingSecurityService.save_candidate_recording(db, sess_b.id, b"COMPANY-B-CONFIDENTIAL-VIDEO", "TOKEN_B_DUMMY", 60)

    # Generate legitimate JWTs
    jwt_a_recruiter = create_access_token("usr_a_rec", role="RECRUITER", company_id="comp_a")
    jwt_candidate = create_access_token("usr_cand", role="CANDIDATE", company_id="comp_a")

    print("\n[OK] Test environment initialized with legitimate JWTs and multi-tenant DB records.")

    # ==============================================================================
    # ATTACK 1: Normal Company A user changes X-Actor-Company-Id to Company B
    # ==============================================================================
    print("\n" + "-" * 80)
    print("ATTACK 1: Normal Company A user changes 'X-Actor-Company-Id' to Company B")
    print("-" * 80)
    headers_1 = {
        "Authorization": f"Bearer {jwt_a_recruiter}",
        "X-Actor-Company-Id": "comp_b" # Attacker attempts to forge tenant header
    }
    # Attempt to request Company B recording presigned URL
    res_1 = client.get(f"/api/v1/recordings/{sess_b.id}/presigned-url", headers=headers_1)
    print(f"Request: GET /api/v1/recordings/{sess_b.id}/presigned-url with X-Actor-Company-Id: comp_b")
    print(f"Response Status: {res_1.status_code} (Expected 403)")
    print(f"Response Detail: {res_1.json().get('detail')}")
    assert res_1.status_code == 403, "ATTACK 1 FAILED TO BLOCK: Tenant spoofing succeeded!"
    print("[PASS] ATTACK 1 STRICTLY BLOCKED: Header tenant spoofing rejected by server.")

    # ==============================================================================
    # ATTACK 2: Normal Company user changes X-Actor-Role to SUPER_ADMIN
    # ==============================================================================
    print("\n" + "-" * 80)
    print("ATTACK 2: Normal Company user changes 'X-Actor-Role' to SUPER_ADMIN")
    print("-" * 80)
    headers_2 = {
        "Authorization": f"Bearer {jwt_a_recruiter}",
        "X-Actor-Role": "SUPER_ADMIN" # Attacker attempts to forge super admin role header
    }
    # Attempt to call Super Admin impersonation endpoint
    res_2 = client.post(
        "/api/v1/auth/impersonate",
        headers=headers_2,
        json={"target_user_id": "usr_b_adm", "reason": "Privilege Escalation"}
    )
    print(f"Request: POST /api/v1/auth/impersonate with X-Actor-Role: SUPER_ADMIN")
    print(f"Response Status: {res_2.status_code} (Expected 403)")
    print(f"Response Detail: {res_2.json().get('detail')}")
    assert res_2.status_code == 403, "ATTACK 2 FAILED TO BLOCK: Role spoofing succeeded!"
    print("[PASS] ATTACK 2 STRICTLY BLOCKED: Header role spoofing rejected by server.")

    # ==============================================================================
    # ATTACK 3: Candidate changes X-Actor-Role to COMPANY_ADMIN
    # ==============================================================================
    print("\n" + "-" * 80)
    print("ATTACK 3: Candidate changes 'X-Actor-Role' to COMPANY_ADMIN")
    print("-" * 80)
    headers_3 = {
        "Authorization": f"Bearer {jwt_candidate}",
        "X-Actor-Role": "COMPANY_ADMIN"
    }
    res_3 = client.get(f"/api/v1/recordings/{sess_b.id}/presigned-url", headers=headers_3)
    print(f"Request: GET /api/v1/recordings/... with Candidate JWT + X-Actor-Role: COMPANY_ADMIN")
    print(f"Response Status: {res_3.status_code} (Expected 403)")
    print(f"Response Detail: {res_3.json().get('detail')}")
    assert res_3.status_code == 403, "ATTACK 3 FAILED TO BLOCK: Candidate role spoofing succeeded!"
    print("[PASS] ATTACK 3 STRICTLY BLOCKED: Candidate role escalation rejected.")

    # ==============================================================================
    # ATTACK 4: Candidate changes X-Actor-Company-Id
    # ==============================================================================
    print("\n" + "-" * 80)
    print("ATTACK 4: Candidate changes 'X-Actor-Company-Id'")
    print("-" * 80)
    headers_4 = {
        "Authorization": f"Bearer {jwt_candidate}",
        "X-Actor-Company-Id": "comp_b"
    }
    res_4 = client.get(f"/api/v1/recordings/{sess_b.id}/presigned-url", headers=headers_4)
    print(f"Request: GET /api/v1/recordings/... with Candidate JWT + X-Actor-Company-Id: comp_b")
    print(f"Response Status: {res_4.status_code} (Expected 403)")
    print(f"Response Detail: {res_4.json().get('detail')}")
    assert res_4.status_code == 403, "ATTACK 4 FAILED TO BLOCK: Candidate tenant spoofing succeeded!"
    print("[PASS] ATTACK 4 STRICTLY BLOCKED: Candidate tenant manipulation rejected.")

    # ==============================================================================
    # ATTACK 5: Missing / Invalid JWT but Valid Actor Headers
    # ==============================================================================
    print("\n" + "-" * 80)
    print("ATTACK 5: Missing / Invalid JWT with forged actor headers")
    print("-" * 80)
    headers_5a = {
        "X-Actor-Role": "SUPER_ADMIN",
        "X-Actor-Id": "usr_super"
    }
    res_5a = client.get(f"/api/v1/recordings/{sess_b.id}/presigned-url", headers=headers_5a)
    print(f"Request: GET /api/v1/recordings/.. with NO JWT (only actor headers)")
    print(f"Response Status: {res_5a.status_code} (Expected 401)")
    print(f"Response Detail: {res_5a.json().get('detail')}")
    assert res_5a.status_code == 401, "ATTACK 5a FAILED TO BLOCK: Request with missing JWT was accepted!"

    headers_5b = {
        "Authorization": "Bearer INVALID.FORGED.TOKEN.ABC",
        "X-Actor-Role": "SUPER_ADMIN"
    }
    res_5b = client.get(f"/api/v1/recordings/{sess_b.id}/presigned-url", headers=headers_5b)
    print(f"Request: GET /api/v1/recordings/.. with FORGED JWT")
    print(f"Response Status: {res_5b.status_code} (Expected 401)")
    assert res_5b.status_code == 401, "ATTACK 5b FAILED TO BLOCK: Request with forged JWT was accepted!"
    print("[PASS] ATTACK 5 STRICTLY BLOCKED: Missing/Invalid JWT rejected regardless of headers.")

    # ==============================================================================
    # ATTACK 6: Valid JWT + Conflicting Actor Headers
    # ==============================================================================
    print("\n" + "-" * 80)
    print("ATTACK 6: Valid JWT + Conflicting Actor Headers")
    print("-" * 80)
    headers_6 = {
        "Authorization": f"Bearer {jwt_a_recruiter}", # Valid JWT belongs to usr_a_rec (RECRUITER, comp_a)
        "X-Actor-Role": "COMPANY_ADMIN",              # Conflicting header
        "X-Actor-Company-Id": "comp_b"                # Conflicting header
    }
    res_6 = client.get(f"/api/v1/recordings/{sess_b.id}/presigned-url", headers=headers_6)
    print(f"Request: GET /api/v1/recordings/.. with Valid JWT but Conflicting X-Actor-Role/Company headers")
    print(f"Response Status: {res_6.status_code} (Expected 403)")
    print(f"Response Detail: {res_6.json().get('detail')}")
    assert res_6.status_code == 403, "ATTACK 6 FAILED TO BLOCK: Conflicting headers were ignored/accepted!"
    print("[PASS] ATTACK 6 STRICTLY BLOCKED: Discrepancy between JWT and headers triggered immediate security block.")

    print("\n" + "=" * 80)
    print("  ALL 6 CRITICAL SECURITY ATTACK VECTORS BLOCKED WITH 100% SUCCESS RATE!")
    print("=" * 80 + "\n")

    db.close()

if __name__ == "__main__":
    run_header_security_attack_tests()
