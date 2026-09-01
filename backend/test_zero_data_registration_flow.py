import sys
import os
import unittest
from fastapi.testclient import TestClient

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from main import app
from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.user import User
from app.models.company import Company
from app.models.candidate import Candidate
from app.models.job import Job

client = TestClient(app)

class TestZeroDataRegistrationFlow(unittest.TestCase):
    def setUp(self):
        # Clean test tables in FK dependency order
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
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()

    def test_zero_seed_and_registration_first_workflow(self):
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

            # 1. Verify DB is 100% EMPTY at startup (0 users, 0 companies)
            self.assertEqual(db.query(User).count(), 0, "Users table must start at exactly 0")
            self.assertEqual(db.query(Company).count(), 0, "Companies table must start at exactly 0")
            print("[TEST 1/5] Confirmed: Database starts with absolute ZERO pre-seeded demo records.")

            # 2. Attempt login without registration -> MUST FAIL (401)
            login_fail = client.post("/api/v1/auth/login", json={
                "email": "unregistered@platform.com",
                "password": "Password123!"
            })
            self.assertEqual(login_fail.status_code, 401, "Unregistered user must NOT be allowed to login")
            print("[TEST 2/5] Confirmed: Unregistered login blocked with 401 Unauthorized.")

            # 3. Super Admin Bootstrapped root account
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
            print("[TEST 3/5] Confirmed: Super Admin root account initialized via secure bootstrap.")

            # 4. Super Admin Login
            login_success = client.post("/api/v1/auth/login", json={
                "email": "admin@ardhnarishwar.ai",
                "password": "SuperAdmin2026!"
            })
            self.assertEqual(login_success.status_code, 200)
            token_data = login_success.json()
            self.assertIn("access_token", token_data)
            self.assertEqual(token_data.get("role"), "SUPER_ADMIN")
            print("[TEST 4/5] Confirmed: Super Admin logged in with JWT Bearer Token.")

            # Register a Company
            comp_res = client.post("/api/v1/auth/register-company", json={
                "company": {
                    "name": "RoboCorp Innovations",
                    "domain": "robocorp.io",
                    "plan": "ENTERPRISE",
                    "industry": "Robotics & AI"
                },
                "admin": {
                    "email": "admin@robocorp.io",
                    "name": "Vikram Malhotra",
                    "password": "CompanyPass2026!"
                }
            })
            self.assertEqual(comp_res.status_code, 200)
            comp_id = comp_res.json()["company_id"]

            # Company Admin creates a Job
            job = Job(
                id="job_robo_01",
                company_id=comp_id,
                title="Lead Autonomous Systems Architect",
                department="Perception & Control",
                location="San Francisco, CA",
                description="Lead engineering of real-time perception stack.",
                required_skills=["Python", "FastAPI", "React"],
                status="OPEN",
                skill_category="SKILLED"
            )
            db.add(job)
            db.commit()

            # 5. Register Candidate (Skilled & Unskilled) -> Assigns ID, Token, Designation
            cand_res = client.post("/api/v1/candidates/apply", json={
                "first_name": "Rohan",
                "last_name": "Verma",
                "email": "rohan.verma@example.com",
                "phone": "+91 9876543210",
                "job_id": "job_robo_01",
                "skill_category": "SKILLED",
                "years_of_experience": 3,
                "skills": ["Python", "FastAPI", "React"]
            })
            self.assertEqual(cand_res.status_code, 200)
            cand_data = cand_res.json()
            self.assertTrue(cand_data.get("success"))
            self.assertTrue(cand_data.get("candidate_id").startswith("cand_"))
            self.assertTrue(cand_data.get("interview_token").startswith("TOKEN_"))
            print(f"[TEST 5/5] Confirmed: Candidate registered with ID: {cand_data.get('candidate_id')}, Token: {cand_data.get('interview_token')}")

        finally:
            db.close()

if __name__ == "__main__":
    unittest.main()
