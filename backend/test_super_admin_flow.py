import urllib.request
import urllib.error
import json

BASE_URL = "http://127.0.0.1:8000"

def test_flow():
    print("=== Testing Super Admin & Clean Platform Flow ===")
    
    # 1. Test Super Admin Login
    login_url = f"{BASE_URL}/api/v1/auth/login"
    login_data = json.dumps({
        "email": "admin@ardhnarishwar.ai",
        "password": "SuperAdmin2026!"
    }).encode("utf-8")
    
    req = urllib.request.Request(
        login_url,
        data=login_data,
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print("[SUCCESS] Super Admin Login:", resp.status)
            print("  User ID:", data.get("user_id"))
            print("  Role:", data.get("role"))
            token = data.get("access_token")
            assert data.get("role") == "SUPER_ADMIN", "Expected role SUPER_ADMIN"
            assert token is not None, "Expected JWT token"
    except Exception as e:
        print("[FAIL] Super Admin Login failed:", e)
        return

    # 2. Test Get Jobs (Should be 0 in clean state)
    jobs_url = f"{BASE_URL}/api/v1/jobs?status_filter=OPEN"
    req_jobs = urllib.request.Request(jobs_url)
    with urllib.request.urlopen(req_jobs) as resp:
        jobs_data = json.loads(resp.read().decode("utf-8"))
        job_list = jobs_data.get("jobs", [])
        print(f"[SUCCESS] Open Jobs in Clean State: {len(job_list)} jobs")
        assert len(job_list) == 0, f"Expected 0 jobs, got {len(job_list)}"

    # 3. Test Fresh Start Endpoint with Token
    fresh_url = f"{BASE_URL}/api/v1/admin/system/fresh-start"
    fresh_payload = json.dumps({
        "confirmation_key": "CONFIRM_ERASE_ALL_DATA_2026",
        "keep_root_admin": True
    }).encode("utf-8")
    req_fresh = urllib.request.Request(
        fresh_url,
        data=fresh_payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    )
    with urllib.request.urlopen(req_fresh) as resp:
        fresh_data = json.loads(resp.read().decode("utf-8"))
        print("[SUCCESS] Factory Reset / Fresh Start Endpoint:", resp.status)
        print("  Message:", fresh_data.get("message"))
        print("  Active Super Admin:", fresh_data.get("active_super_admin"))

    # 4. Verify Local Dev Server (Vite)
    vite_url = "http://127.0.0.1:5173"
    with urllib.request.urlopen(vite_url) as resp:
        print(f"[SUCCESS] Local Vite Frontend: HTTP {resp.status} OK")

    # 5. Verify Live Production Netlify Site
    prod_url = "https://teal-praline-f162a3.netlify.app"
    with urllib.request.urlopen(prod_url) as resp:
        print(f"[SUCCESS] Live Production Netlify Site: HTTP {resp.status} OK")

    print("\nAll Super Admin & Clean Platform verifications PASSED perfectly!")

if __name__ == "__main__":
    test_flow()
