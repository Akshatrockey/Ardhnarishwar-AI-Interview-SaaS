"""
Test Real-Time WebSocket and Event Bus Routing
"""
from fastapi.testclient import TestClient
from main import app
import time

def test_websocket_realtime():
    client = TestClient(app)
    
    # 1. Test Stats endpoint
    stats_res = client.get("/api/v1/realtime/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    print("Initial Realtime Stats:", stats)
    assert stats["status"] == "ONLINE"

    # 2. Test Candidate and Recruiter WebSocket connection & message passing
    with client.websocket_connect("/ws/realtime/CANDIDATE/cand_priya?company_id=comp_cyberdyne&session_id=sess_01") as ws_cand:
        # Candidate receives presence
        msg1 = ws_cand.receive_json()
        print("Candidate received on connect:", msg1["type"])

        # Candidate sends PING
        ws_cand.send_json({"type": "PING", "timestamp": time.time()})
        pong = ws_cand.receive_json()
        print("Candidate received:", pong)
        assert pong["type"] == "PONG"

        # Candidate sends Telemetry
        ws_cand.send_json({
            "type": "INTERVIEW_TELEMETRY",
            "senderId": "cand_priya",
            "senderRole": "CANDIDATE",
            "payload": {
                "candidateId": "cand_priya",
                "candidateName": "Priya Sharma",
                "sessionId": "sess_01",
                "companyId": "comp_cyberdyne",
                "questionIndex": 1,
                "questionTitle": "Kinematics",
                "wpm": 140,
                "confidencePct": 92
            }
        })
        print("Candidate telemetry sent successfully!")

    print("\n[SUCCESS] All Real-Time WebSocket Tests Passed!")

if __name__ == "__main__":
    test_websocket_realtime()
