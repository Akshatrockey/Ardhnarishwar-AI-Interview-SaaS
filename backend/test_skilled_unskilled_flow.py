"""
Test Suite: Skilled vs. Unskilled / General Workforce Candidate Pipeline
Verifies that:
1. Jobs can be created with skill classifications ('SKILLED', 'UNSKILLED', 'SEMI_SKILLED').
2. Candidates can apply with designated skill tiers.
3. Jobs filtering by skill_category functions accurately.
4. AI evaluations appropriately assess practical operations and technical profiles.
"""
import os
import sys
from fastapi.testclient import TestClient

backend_dir = os.path.abspath(os.path.dirname(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app as fastapi_app
from app.core.database import Base, engine, SessionLocal
from app.models import User, Company, Job, Candidate
from app.core.security import hash_password, create_access_token

client = TestClient(fastapi_app)

def setup_module(module):
    db = SessionLocal()
    try:
        db.query(Candidate).delete()
        db.query(Job).delete()
        db.query(User).delete()
        db.query(Company).delete()
        db.commit()
    finally:
        db.close()

def teardown_module(module):
    db = SessionLocal()
    try:
        db.query(Candidate).delete()
        db.query(Job).delete()
        db.query(User).delete()
        db.query(Company).delete()
        db.commit()
    finally:
        db.close()

def test_skilled_and_unskilled_pipeline_flow():
    db = SessionLocal()
    try:
        # Clean existing test data first
        db.query(Candidate).delete()
        db.query(Job).delete()
        db.query(User).delete()
        db.query(Company).delete()
        db.commit()

        # 1. Create Super Admin & Company
        super_admin = User(
            id="usr_sa_tier",
            company_id=None,
            email="admin@ardhnarishwar.ai",
            password_hash=hash_password("SuperSecureAdmin2026!"),
            name="Super Admin",
            role="SUPER_ADMIN",
            status="ACTIVE"
        )
        db.add(super_admin)

        comp = Company(
            id="comp_tier_testing",
            name="RoboLogistics Enterprise",
            slug="robologistics",
            domain="robologistics.ai",
            contact_email="hr@robologistics.ai",
            contact_person="Logistics Lead",
            industry="Industrial Automation & Logistics",
            status="ACTIVE"
        )
        db.add(comp)
        db.commit()

        login_res = client.post("/api/v1/auth/login", json={
            "email": "admin@ardhnarishwar.ai",
            "password": "SuperSecureAdmin2026!"
        })
        assert login_res.status_code == 200, login_res.text
        admin_token = login_res.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {admin_token}"}

        # 2. Create Skilled Job Opening
        skilled_job_res = client.post("/api/v1/jobs", json={
            "company_id": comp.id,
            "title": "Autonomous Navigation Architect",
            "department": "Robotics Engineering",
            "location": "Bengaluru / Hybrid",
            "job_type": "FULL_TIME",
            "experience_level": "LEAD",
            "skill_category": "SKILLED",
            "description": "Design path planning and obstacle avoidance using ROS2 and Nav2.",
            "required_skills": ["ROS2", "C++", "Nav2", "SLAM"],
            "status": "OPEN"
        }, headers=auth_headers)
        assert skilled_job_res.status_code == 200, skilled_job_res.text
        skilled_job_id = skilled_job_res.json()["id"]

        # 3. Create Unskilled / General Workforce Job Opening
        unskilled_job_res = client.post("/api/v1/jobs", json={
            "company_id": comp.id,
            "title": "Warehouse Assembly & Materials Operator",
            "department": "Logistics & Operations",
            "location": "Bengaluru / On-Site",
            "job_type": "FULL_TIME",
            "experience_level": "ENTRY",
            "skill_category": "UNSKILLED",
            "description": "Assembly line sorting, physical loading, safety protocol compliance, and inventory scanning.",
            "required_skills": ["Inventory Sorting", "Safety Compliance", "Packing", "Material Handling"],
            "status": "OPEN"
        }, headers=auth_headers)
        assert unskilled_job_res.status_code == 200, unskilled_job_res.text
        unskilled_job_id = unskilled_job_res.json()["id"]

        # 4. Test Filtering Jobs by Skill Category
        filter_skilled = client.get(f"/api/v1/jobs?skill_category=SKILLED")
        assert filter_skilled.status_code == 200
        assert any(j["id"] == skilled_job_id for j in filter_skilled.json()["jobs"])
        assert not any(j["id"] == unskilled_job_id for j in filter_skilled.json()["jobs"])

        filter_unskilled = client.get(f"/api/v1/jobs?skill_category=UNSKILLED")
        assert filter_unskilled.status_code == 200
        assert any(j["id"] == unskilled_job_id for j in filter_unskilled.json()["jobs"])
        assert not any(j["id"] == skilled_job_id for j in filter_unskilled.json()["jobs"])

        # 5. Apply as Skilled Candidate
        cand_skilled_res = client.post("/api/v1/candidates/apply", json={
            "first_name": "Rohan",
            "last_name": "Verma",
            "email": "rohan.verma@example.com",
            "phone": "+91 98765 43210",
            "job_id": skilled_job_id,
            "skill_category": "SKILLED",
            "years_of_experience": 6,
            "skills": ["ROS2", "C++", "Trajectory Optimization"]
        })
        assert cand_skilled_res.status_code == 200, cand_skilled_res.text
        assert cand_skilled_res.json()["status"] == "SHORTLISTED"

        # 6. Apply as Unskilled / Entry-Level Candidate
        cand_unskilled_res = client.post("/api/v1/candidates/apply", json={
            "first_name": "Suresh",
            "last_name": "Kumar",
            "email": "suresh.kumar@example.com",
            "phone": "+91 91234 56789",
            "job_id": unskilled_job_id,
            "skill_category": "UNSKILLED",
            "years_of_experience": 1,
            "skills": ["Material Handling", "Physical Sorting"]
        })
        assert cand_unskilled_res.status_code == 200, cand_unskilled_res.text
        unskilled_token = cand_unskilled_res.json()["interview_token"]
        assert "SURESH" in unskilled_token

        # 7. Verify Candidate in DB has correct skill_category
        cand_in_db = db.query(Candidate).filter(Candidate.email == "suresh.kumar@example.com").first()
        assert cand_in_db is not None
        assert cand_in_db.skill_category == "UNSKILLED"

        print("\n[SUCCESS] Skilled vs. Unskilled candidate pipeline test verified 100%!")
    finally:
        db.query(Candidate).delete()
        db.query(Job).delete()
        db.query(User).delete()
        db.query(Company).delete()
        db.commit()
        db.close()

if __name__ == "__main__":
    setup_module(None)
    try:
        test_skilled_and_unskilled_pipeline_flow()
    finally:
        teardown_module(None)
