"""
Ardhnarishwar AI SaaS - Verification Test for Copilot, Settings & Video Vault
"""
import sys
import os
import json

from fastapi.testclient import TestClient
from main import app
from app.core.database import SessionLocal, engine
from app.core.security import create_access_token
from app.models import User, Company, Candidate, InterviewSession

client = TestClient(app)

def test_endpoints():
    db = SessionLocal()
    try:
        super_admin = db.query(User).filter(User.role == "SUPER_ADMIN").first()
        admin_token = create_access_token(super_admin.id, super_admin.role, super_admin.company_id)
        auth_headers = {"Authorization": f"Bearer {admin_token}"}

        print("\n--- 1. Testing AI Multi-Engine Models & Chat ---")
        models_res = client.get("/api/v1/ai/models")
        assert models_res.status_code == 200, f"Models failed: {models_res.text}"
        models_data = models_res.json()
        print(f"  [OK] AI Models Listed: {len(models_data['models'])} models available.")
        assert len(models_data["models"]) >= 4

        # Test non-streaming chat
        chat_payload = {
            "prompt": "Give 3 hard questions on ROS2 kinematics.",
            "mode": "recruiter",
            "model_id": "claude-3-5-sonnet-20241022",
            "stream": False,
            "company_name": "Cyberdyne Systems"
        }
        chat_res = client.post("/api/v1/ai/copilot/chat", json=chat_payload)
        assert chat_res.status_code == 200, f"Chat failed: {chat_res.text}"
        chat_data = chat_res.json()
        assert chat_data["success"] is True
        print(f"  [OK] Copilot Chat Response: Engine = {chat_data['data']['engine']}, Model = {chat_data['data']['model']}, Fallback = {chat_data['data']['fallback_occurred']}")
        assert len(chat_data["data"]["text"]) > 50

        # Test streaming chat
        chat_payload["stream"] = True
        stream_res = client.post("/api/v1/ai/copilot/chat", json=chat_payload)
        assert stream_res.status_code == 200
        assert "text/event-stream" in stream_res.headers["content-type"]
        print("  [OK] Copilot SSE Streaming Connection Verified.")

        print("\n--- 2. Testing Company Settings & Expanded Profile ---")
        comp = db.query(Company).first()
        assert comp is not None, "No company found in database"
        
        get_res = client.get(f"/api/v1/companies/{comp.id}", headers=auth_headers)
        assert get_res.status_code == 200, f"Get company failed: {get_res.text}"
        comp_profile = get_res.json()
        print(f"  [OK] Retrieved Company Profile: {comp_profile['name']}, Legal Name: {comp_profile['legal_name']}")

        update_payload = {
            "name": comp.name,
            "legal_name": "Cyberdyne Systems Global Robotics Inc.",
            "display_name": "Cyberdyne Robotics",
            "tax_id": "US-EIN-98-7654321",
            "company_size": "201-500 employees",
            "brand_accent_color": "#06B6D4",
            "website": "https://cyberdyne.ai",
            "hq_street": "100 Robotics Boulevard, Tech Park",
            "hq_city": "San Francisco",
            "hq_state": "California",
            "hq_country": "United States",
            "hq_postal_code": "94107",
            "phone": "+1 (415) 890-1234",
            "contact_email": "admin@cyberdyne.ai",
            "support_email": "support@cyberdyne.ai",
            "timezone": "America/Los_Angeles",
            "currency": "USD",
            "date_format": "YYYY-MM-DD",
            "work_week": "Monday - Friday",
            "social_links": {
                "linkedin": "https://linkedin.com/company/cyberdyne",
                "twitter": "https://x.com/cyberdyne",
                "github": "https://github.com/cyberdyne"
            },
            "data_retention_days": 180,
            "security_contact_email": "security@cyberdyne.ai",
            "ai_custom_rules_enabled": True
        }
        put_res = client.put(f"/api/v1/companies/{comp.id}", json=update_payload, headers=auth_headers)
        assert put_res.status_code == 200, f"Put company failed: {put_res.text}"
        updated_data = put_res.json()["data"]
        assert updated_data["legal_name"] == "Cyberdyne Systems Global Robotics Inc."
        assert updated_data["tax_id"] == "US-EIN-98-7654321"
        assert updated_data["timezone"] == "America/Los_Angeles"
        print(f"  [OK] Organization Settings Persisted: Legal Name = {updated_data['legal_name']}, Timezone = {updated_data['timezone']}, Tax ID = {updated_data['tax_id']}")

        print("\n--- 3. Testing AI Video Vault Indexing ---")
        sess = db.query(InterviewSession).first()
        if sess:
            vault_res = client.post(f"/api/v1/recordings/{sess.id}/index-vault", headers=auth_headers)
            assert vault_res.status_code == 200, f"Vault index failed: {vault_res.text}"
            vault_json = vault_res.json()
            assert vault_json["success"] is True
            v_data = vault_json["vault_index"]
            assert len(v_data["key_moments"]) >= 3
            assert "transcription" in v_data
            assert "behavioral_highlights" in v_data
            print(f"  [OK] Video Vault Index Generated: {len(v_data['key_moments'])} key moments, Status: {v_data['indexing_status']}")

        print("\n=================================================================")
        print("[SUCCESS] ALL COPILOT, SETTINGS & VAULT TESTS PASSED!")
        print("=================================================================\n")
    finally:
        db.close()

if __name__ == "__main__":
    test_endpoints()
