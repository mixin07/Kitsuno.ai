import os
import sys
import time
from fastapi.testclient import TestClient
from jose import jwt

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.config import settings

client = TestClient(app)

def mint(sub: str, email: str, name: str, role: str) -> str:
    key = settings.supabase_jwt_secret or settings.jwt_secret_key
    payload = {
        "sub": sub,
        "email": email,
        "aud": "authenticated",
        "iss": f"{settings.supabase_url.rstrip('/')}/auth/v1",
        "exp": int(time.time()) + 3600,
        "user_metadata": {"name": name, "role": role}
    }
    return jwt.encode(payload, key, algorithm="HS256")

users = [
    ("ADMIN", "jeyavelan68@gmail.com", "Mirudhula", 81, "7e3d8342-990a-4fa8-bf78-d42171120001"),
    ("INSTRUCTOR", "sm7510@srmist.edu.in", "Shahid", 1023, "f125fbeb-1c03-45d8-952e-effac19f4995"),
    ("STUDENT", "mj0971@gmail.com", "Mikasa", 1024, "3a1b9251-a463-4511-82e6-7b235d64336a")
]

print("\n--- SMOKE VERIFICATION FOR 3 PROTECTED USERS ---")
all_ok = True
for role, email, name, expected_id, sub in users:
    tok = mint(sub, email, name, role)
    headers = {"Authorization": f"Bearer {tok}"}
    res = client.get("/api/v1/auth/me", headers=headers)
    if res.status_code == 200:
        data = res.json()
        match = (data.get("id") == expected_id and data.get("role") == role and data.get("approval_status") == "APPROVED")
        status_txt = "[OK]" if match else "[MISMATCH]"
        print(f"  {status_txt} {name} ({email}): ID={data.get('id')}, Role={data.get('role')}, Approval={data.get('approval_status')}")
        if not match:
            all_ok = False
    else:
        print(f"  [FAIL] {name} ({email}): HTTP {res.status_code} - {res.text}")
        all_ok = False

# Also test role-specific endpoints
admin_tok = mint("7e3d8342-990a-4fa8-bf78-d42171120001", "jeyavelan68@gmail.com", "Mirudhula", "ADMIN")
inst_tok = mint("f125fbeb-1c03-45d8-952e-effac19f4995", "sm7510@srmist.edu.in", "Shahid", "INSTRUCTOR")
stud_tok = mint("3a1b9251-a463-4511-82e6-7b235d64336a", "mj0971@gmail.com", "Mikasa", "STUDENT")

a_res = client.get("/api/v1/admin/instructor-requests", headers={"Authorization": f"Bearer {admin_tok}"})
print(f"  Admin requests endpoint: HTTP {a_res.status_code} ({len(a_res.json()) if a_res.status_code == 200 else 'ERR'} items)")

i_res = client.get("/api/v1/courses", headers={"Authorization": f"Bearer {inst_tok}"})
print(f"  Instructor courses endpoint: HTTP {i_res.status_code} ({len(i_res.json()) if i_res.status_code == 200 else 'ERR'} courses)")

s_res = client.get("/api/v1/gamification/xp-summary", headers={"Authorization": f"Bearer {stud_tok}"})
print(f"  Student gamification endpoint: HTTP {s_res.status_code}")

print(f"\nFinal Smoke Status: {'ALL GREEN' if all_ok and a_res.status_code == 200 and i_res.status_code == 200 and s_res.status_code == 200 else 'FAIL'}")
