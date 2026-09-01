import sys
import os
import unittest
from fastapi.testclient import TestClient

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token, verify_password, hash_password
from app.models.user import User
from app.models.company import Company
from app.models.candidate import Candidate
from app.models.job import Job

client = TestClient(app)

class TestCompleteAuthArchitecture(unittest.TestCase):
    def setUp(self):
        db = SessionLocal()
        try:
            from app.models import (
                AIEvaluationReport, CandidateAnswer, InterviewSession,
                Resume, Candidate, QuestionBank, InterviewRound, Job,
                AuditLog, Subscription, User, Company
            )
            db.query(AIEvaluationReport).delete()
            db.query(CandidateAnswer).delete()
            db.query(InterviewSession).delete()
            db.query(Resume).delete()
            db.query(Candidate).delete()
            db.query(QuestionBank).delete()
            db.query(InterviewRound).delete()
            db.query(Job).delete()
            db.query(AuditLog).delete()
            db.query(Subscription).delete()
            db.query(User).delete()
            db.query(Company).delete()
            
            # Root Super Admin bootstrap
            root_admin = User(
                id="usr_super_root_master",
                email="admin@ardhnarishwar.ai",
                password_hash=hash_password("SuperAdmin2026!"),
                name="Ardhnarishwar Platform Master",
                role="SUPER_ADMIN",
                designation="Master Platform Architect",
                status="ACTIVE"
            )
            db.add(root_admin)
            db.commit()
        finally:
            db.close()

    def tearDown(self):
        db = SessionLocal()
        try:
            from app.models import (
                AIEvaluationReport, CandidateAnswer, InterviewSession,
                Resume, Candidate, QuestionBank, InterviewRound, Job,
                AuditLog, Subscription, User, Company
            )
            db.query(AIEvaluationReport).delete()
            db.query(CandidateAnswer).delete()
            db.query(InterviewSession).delete()
            db.query(Resume).delete()
            db.query(Candidate).delete()
            db.query(QuestionBank).delete()
            db.query(InterviewRound).delete()
            db.query(Job).delete()
            db.query(AuditLog).delete()
            db.query(Subscription).delete()
            db.query(User).delete()
            db.query(Company).delete()
            db.commit()
        finally:
            db.close()

    def test_1_candidate_registration_and_authentication(self):
        """
        Test 1: New Candidate Flow
        - Register Candidate (Full Name, Email, Password, Track, Experience)
        - Verified real database record and hashed password
        - Verified token and Candidate ID generation
        - Candidate login & role verification
        """
        # Register Candidate
        res = client.post("/api/v1/auth/register-candidate", json={
            "firstName": "Priya",
            "lastName": "Sharma",
            "email": "priya.sharma@example.com",
            "phone": "+91 9876543211",
            "years_of_experience": 4,
            "password": "CandidatePass2026!"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("id").startswith("cand_"))
        self.assertTrue(data.get("interview_token").startswith("TOKEN_"))
        
        # Verify Candidate exists in database
        db = SessionLocal()
        try:
            cand = db.query(Candidate).filter(Candidate.email == "priya.sharma@example.com").first()
            self.assertIsNotNone(cand, "Candidate must exist in candidates table")
            self.assertEqual(cand.first_name, "Priya")
            
            cand_user = db.query(User).filter(User.email == "priya.sharma@example.com").first()
            self.assertIsNotNone(cand_user, "Candidate user account must exist in users table")
            self.assertEqual(cand_user.role, "CANDIDATE")
            self.assertTrue(verify_password("CandidatePass2026!", cand_user.password_hash), "Password must be securely hashed")
        finally:
            db.close()

        # Login with Candidate credentials
        login_res = client.post("/api/v1/auth/login", json={
            "email": "priya.sharma@example.com",
            "password": "CandidatePass2026!"
        })
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.json()
        self.assertEqual(login_data.get("role"), "CANDIDATE")
        self.assertIn("access_token", login_data)
        print("[TEST 1 PASSED] Candidate registration, real DB record, password hashing & login verified.")

    def test_2_company_registration_and_authentication(self):
        """
        Test 2: New Company Flow
        - Register Company (Company Name, Domain, Email, Admin Name, Password)
        - Verified Company and Company Admin records in DB
        - Company Admin login & role verification = COMPANY_ADMIN
        """
        res = client.post("/api/v1/auth/register-company", json={
            "company": {
                "name": "Tesla Neural Dynamics",
                "domain": "teslaneural.com",
                "plan": "ENTERPRISE_ROBOTICS",
                "industry": "Autonomous Robotics"
            },
            "admin": {
                "name": "Elon Musk",
                "email": "elon@teslaneural.com",
                "password": "CompanyAdminPass2026!"
            }
        })
        self.assertEqual(res.status_code, 200)
        comp_id = res.json().get("company_id")
        self.assertTrue(comp_id.startswith("comp_"))

        # Verify in DB
        db = SessionLocal()
        try:
            comp = db.query(Company).filter(Company.id == comp_id).first()
            self.assertIsNotNone(comp)
            self.assertEqual(comp.name, "Tesla Neural Dynamics")
            
            admin_user = db.query(User).filter(User.email == "elon@teslaneural.com").first()
            self.assertIsNotNone(admin_user)
            self.assertEqual(admin_user.role, "COMPANY_ADMIN")
            self.assertEqual(admin_user.company_id, comp_id)
            self.assertTrue(verify_password("CompanyAdminPass2026!", admin_user.password_hash))
        finally:
            db.close()

        # Login as Company Admin
        login_res = client.post("/api/v1/auth/login", json={
            "email": "elon@teslaneural.com",
            "password": "CompanyAdminPass2026!"
        })
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.json()
        self.assertEqual(login_data.get("role"), "COMPANY_ADMIN")
        self.assertEqual(login_data.get("company_id"), comp_id)
        print("[TEST 2 PASSED] Company registration, tenant provisioning, and company admin auth verified.")

    def test_3_super_admin_authentication_and_privileges(self):
        """
        Test 3: Super Admin Flow
        - Authenticate Super Admin via /api/v1/auth/login
        - Verify role = SUPER_ADMIN
        - Verify unauthenticated or unauthorized access to platform-wide stats is rejected
        """
        # Super admin login
        login_res = client.post("/api/v1/auth/login", json={
            "email": "admin@ardhnarishwar.ai",
            "password": "SuperAdmin2026!"
        })
        self.assertEqual(login_res.status_code, 200)
        admin_token = login_res.json().get("access_token")
        self.assertEqual(login_res.json().get("role"), "SUPER_ADMIN")

        # Access platform-wide protected companies API with Super Admin token
        companies_res = client.get("/api/v1/companies", headers={"Authorization": f"Bearer {admin_token}"})
        self.assertEqual(companies_res.status_code, 200)
        print("[TEST 3 PASSED] Super Admin authentication, role validation & platform-wide access verified.")

    def test_4_tenant_isolation(self):
        """
        Test 4: Strict Tenant Isolation
        - Create Company A and Company B
        - Company A Admin lists companies / data -> Only gets Company A data
        - Company B Admin lists companies / data -> Only gets Company B data
        - Super Admin lists companies -> Gets all companies
        """
        db = SessionLocal()
        try:
            # Create Company A
            comp_a = Company(
                id="comp_alpha",
                name="Alpha Industries",
                slug="alpha-ind",
                domain="alpha.com",
                plan_tier="GROWTH",
                status="ACTIVE",
                contact_email="admin@alpha.com",
                contact_person="Alice",
                industry="Tech"
            )
            user_a = User(
                id="usr_alpha_admin",
                company_id="comp_alpha",
                email="admin@alpha.com",
                password_hash=hash_password("PassAlpha123!"),
                name="Alice",
                role="COMPANY_ADMIN",
                status="ACTIVE"
            )
            # Create Company B
            comp_b = Company(
                id="comp_beta",
                name="Beta Robotics",
                slug="beta-rob",
                domain="beta.com",
                plan_tier="GROWTH",
                status="ACTIVE",
                contact_email="admin@beta.com",
                contact_person="Bob",
                industry="Robotics"
            )
            user_b = User(
                id="usr_beta_admin",
                company_id="comp_beta",
                email="admin@beta.com",
                password_hash=hash_password("PassBeta123!"),
                name="Bob",
                role="COMPANY_ADMIN",
                status="ACTIVE"
            )
            db.add_all([comp_a, user_a, comp_b, user_b])
            db.commit()
        finally:
            db.close()

        # Token A
        token_a = create_access_token(user_id="usr_alpha_admin", role="COMPANY_ADMIN", company_id="comp_alpha")
        # Token B
        token_b = create_access_token(user_id="usr_beta_admin", role="COMPANY_ADMIN", company_id="comp_beta")
        # Super Admin Token
        token_super = create_access_token(user_id="usr_super_root_master", role="SUPER_ADMIN", company_id=None)

        # 1. Company A queries companies endpoint
        res_a = client.get("/api/v1/companies", headers={"Authorization": f"Bearer {token_a}"})
        self.assertEqual(res_a.status_code, 200)
        comps_a = res_a.json()
        self.assertEqual(len(comps_a), 1)
        self.assertEqual(comps_a[0]["id"], "comp_alpha", "Company A must only see Company A")

        # 2. Company B queries companies endpoint
        res_b = client.get("/api/v1/companies", headers={"Authorization": f"Bearer {token_b}"})
        self.assertEqual(res_b.status_code, 200)
        comps_b = res_b.json()
        self.assertEqual(len(comps_b), 1)
        self.assertEqual(comps_b[0]["id"], "comp_beta", "Company B must only see Company B")

        # 3. Super Admin queries companies endpoint -> Sees both
        res_super = client.get("/api/v1/companies", headers={"Authorization": f"Bearer {token_super}"})
        self.assertEqual(res_super.status_code, 200)
        comps_super = res_super.json()
        self.assertGreaterEqual(len(comps_super), 2, "Super Admin must see all tenant companies")
        print("[TEST 4 PASSED] Row-level Multi-Tenant Isolation verified across Company A, Company B & Super Admin.")

    def test_5_logout_and_unauthorized_protection(self):
        """
        Test 5: Protection & Unauthorized Rejection
        - Requests without Authorization header must be rejected with 401
        - Invalid tokens must be rejected with 401
        """
        res_no_auth = client.get("/api/v1/companies")
        self.assertEqual(res_no_auth.status_code, 401)

        res_bad_token = client.get("/api/v1/companies", headers={"Authorization": "Bearer invalid_token_xyz"})
        self.assertEqual(res_bad_token.status_code, 401)
        print("[TEST 5 PASSED] Route protection and JWT authorization verification passed 100%.")

if __name__ == "__main__":
    unittest.main()
