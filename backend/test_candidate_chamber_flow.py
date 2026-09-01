import sys
import os
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(__file__))

from main import app
from app.core.database import SessionLocal
from app.models import (
    User,
    Company,
    Candidate,
    Job,
    QuestionBank,
    InterviewSession,
    CandidateAnswer,
    AIEvaluationReport
)

client = TestClient(app)

class TestCandidateChamberFlow(unittest.TestCase):
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

    def test_complete_candidate_registration_to_chamber_flow(self):
        """
        1. Register candidate from scratch with zero pre-existing companies/jobs.
        2. Verify candidate gets a token.
        3. Call /sessions/initiate with token -> gets session and 3 questions.
        4. Submit answers for all questions.
        5. Complete session -> produces evaluation report.
        """
        # Step 1: Candidate Registration
        reg_res = client.post("/api/v1/auth/register-candidate", json={
            "firstName": "Aarav",
            "lastName": "Verma",
            "email": "aarav.verma@example.com",
            "phone": "+91 9988776655",
            "years_of_experience": 3,
            "password": "Password123!"
        })
        self.assertEqual(reg_res.status_code, 200)
        cand_data = reg_res.json()
        cand_id = cand_data.get("id")
        token = cand_data.get("interview_token")
        self.assertIsNotNone(cand_id)
        self.assertIsNotNone(token)
        print(f"\n[STEP 1] Candidate Registered: {cand_id}, Token: {token}")

        # Step 2: Token verification endpoint
        verify_res = client.get(f"/api/v1/auth/candidate-verify?token={token}")
        self.assertEqual(verify_res.status_code, 200)
        self.assertEqual(verify_res.json()["id"], cand_id)
        print("[STEP 2] Token Verification Succeeded.")

        # Step 3: Initiate Live Interview Session
        init_res = client.post("/api/v1/interviews/sessions/initiate", json={"token": token})
        self.assertEqual(init_res.status_code, 200)
        init_data = init_res.json()
        session_id = init_data.get("session_id")
        questions = init_data.get("questions")
        
        self.assertIsNotNone(session_id)
        self.assertGreaterEqual(len(questions), 3, "Must return at least 3 questions")
        print(f"[STEP 3] Interview Session Initiated: {session_id}, {len(questions)} Questions Assigned.")

        # Step 4: Submit answers for all questions
        for q in questions:
            ans_res = client.post(f"/api/v1/interviews/sessions/{session_id}/answer", json={
                "question_id": q["id"],
                "transcript": "I have extensive experience building scalable microservices and distributed systems. In my previous role, I optimized database queries and led continuous integration pipelines.",
                "duration_seconds": 45,
                "video_timestamp_start": 0,
                "video_timestamp_end": 45
            })
            self.assertEqual(ans_res.status_code, 200)
            ans_data = ans_res.json()
            self.assertTrue(ans_data["success"])
            self.assertGreater(ans_data["score"], 0)
        print("[STEP 4] All Candidate Answers Submitted and Evaluated by AI Vectorizer.")

        # Step 5: Complete Interview Session
        comp_res = client.post(f"/api/v1/interviews/sessions/{session_id}/complete", json={
            "system_diagnostics": {
                "browser": "Chrome",
                "webcam_active": True,
                "mic_active": True,
                "resolution": "1920x1080"
            }
        })
        self.assertEqual(comp_res.status_code, 200)
        comp_data = comp_res.json()
        self.assertEqual(comp_data["status"], "EVALUATED")
        self.assertIn("overall_score", comp_data)
        self.assertIn("recommendation", comp_data)
        print(f"[STEP 5] Session Finalized! Recommendation: {comp_data.get('recommendation')}, Score: {comp_data.get('overall_score')}")

if __name__ == "__main__":
    unittest.main()
