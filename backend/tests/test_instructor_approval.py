import time
import uuid
import pytest
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import select, text

from app.config import settings
from app.database import SessionLocal
from app.main import app
from app.models.user import ApprovalStatus, User, UserRole

client = TestClient(app)


def _mint_token(
    sub: str,
    email: str | None = None,
    name: str | None = None,
    role: str | None = None,
    secret: str | None = None,
) -> str:
    key = secret or settings.supabase_jwt_secret or settings.jwt_secret_key
    exp = int(time.time()) + 3600
    meta = {}
    if name:
        meta["name"] = name
    if role:
        meta["role"] = role
    payload = {
        "sub": sub,
        "email": email,
        "aud": "authenticated",
        "iss": f"{settings.supabase_url.rstrip('/')}/auth/v1",
        "exp": exp,
        "user_metadata": meta,
    }
    return jwt.encode(payload, key, algorithm="HS256")


def _create_temp_auth_user(db, user_id: uuid.UUID, email: str, name: str = "Test User"):
    db.execute(
        text("DELETE FROM auth.users WHERE email = :email OR id = CAST(:id AS uuid)"),
        {"email": email, "id": str(user_id)},
    )
    db.commit()
    db.execute(
        text("""
            INSERT INTO auth.users (
                id, instance_id, aud, role, email, encrypted_password,
                email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                created_at, updated_at
            ) VALUES (
                CAST(:id AS uuid),
                '00000000-0000-0000-0000-000000000000'::uuid,
                'authenticated',
                'authenticated',
                CAST(:email AS text),
                '$2b$12$DUMMYTESTHASHFOREXAMPLE',
                NOW(),
                '{"provider": "email"}'::jsonb,
                jsonb_build_object('name', CAST(:name AS text)),
                NOW(),
                NOW()
            )
        """),
        {"id": str(user_id), "email": email, "name": name},
    )
    db.commit()


def _delete_temp_auth_user(db, user_id: uuid.UUID, email: str | None = None):
    try:
        if email:
            db.execute(
                text("DELETE FROM auth.users WHERE id = CAST(:id AS uuid) OR email = :email"),
                {"id": str(user_id), "email": email},
            )
        else:
            db.execute(text("DELETE FROM auth.users WHERE id = CAST(:id AS uuid)"), {"id": str(user_id)})
        db.commit()
    except Exception:
        db.rollback()


def _get_admin_token(db, admin_uuid: uuid.UUID) -> str:
    admin_email = settings.admin_email
    _create_temp_auth_user(db, admin_uuid, admin_email, "Platform Admin")
    token = _mint_token(sub=str(admin_uuid), email=admin_email, name="Platform Admin")
    # Link admin in public.users via /auth/me
    client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    return token


def test_public_signup_cannot_create_admin():
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Attacker",
            "email": f"attacker_{uuid.uuid4().hex[:6]}@example.com",
            "password": "Password123!",
            "role": "ADMIN",
        },
    )
    assert resp.status_code == 403
    assert "Cannot register as ADMIN" in resp.json()["detail"]


def test_student_signup_is_immediately_active():
    db = SessionLocal()
    unique_id = uuid.uuid4()
    email = f"student_{unique_id.hex[:6]}@example.com"
    try:
        _create_temp_auth_user(db, unique_id, email, "New Student")
        token = _mint_token(sub=str(unique_id), email=email, name="New Student", role="STUDENT")

        resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == email
        assert data["role"] == "STUDENT"
        assert data["approval_status"] == "APPROVED"

        # Can access student endpoint
        resp_student = client.get("/api/v1/auth/test/student", headers={"Authorization": f"Bearer {token}"})
        assert resp_student.status_code == 200
    finally:
        _delete_temp_auth_user(db, unique_id, email)
        db.close()


def test_instructor_signup_is_pending_and_blocked():
    db = SessionLocal()
    unique_id = uuid.uuid4()
    email = f"instructor_{unique_id.hex[:6]}@example.com"
    try:
        _create_temp_auth_user(db, unique_id, email, "Pending Instructor")
        token = _mint_token(sub=str(unique_id), email=email, name="Pending Instructor", role="INSTRUCTOR")

        # Accessing /auth/me initializes their profile as PENDING
        resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == email
        assert data["role"] == "STUDENT"  # NOT granted instructor privileges yet
        assert data["requested_role"] == "INSTRUCTOR"
        assert data["approval_status"] == "PENDING"

        # Attempting to call Instructor endpoint directly yields 403
        resp_inst = client.get("/api/v1/auth/test/instructor", headers={"Authorization": f"Bearer {token}"})
        assert resp_inst.status_code == 403
        assert "Instructor account is pending approval" in resp_inst.json()["detail"]
    finally:
        _delete_temp_auth_user(db, unique_id, email)
        db.close()


def test_admin_approve_and_reject_flow():
    db = SessionLocal()
    admin_uuid = uuid.uuid4()
    candidate_uuid = uuid.uuid4()
    candidate_email = f"candidate_{candidate_uuid.hex[:6]}@example.com"

    try:
        admin_token = _get_admin_token(db, admin_uuid)
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 1. Create candidate pending instructor
        _create_temp_auth_user(db, candidate_uuid, candidate_email, "Candidate Instructor")
        inst_token = _mint_token(sub=str(candidate_uuid), email=candidate_email, name="Candidate Instructor", role="INSTRUCTOR")
        init_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {inst_token}"})
        assert init_resp.status_code == 200
        user_id = init_resp.json()["id"]

        # 2. Admin views pending instructor requests
        req_resp = client.get("/api/v1/admin/instructor-requests", headers=admin_headers)
        assert req_resp.status_code == 200
        requests = req_resp.json()
        assert any(r["id"] == user_id and r["approval_status"] == "PENDING" for r in requests)

        # 3. Non-admin cannot access admin instructor requests
        forbidden_resp = client.get("/api/v1/admin/instructor-requests", headers={"Authorization": f"Bearer {inst_token}"})
        assert forbidden_resp.status_code == 403

        # 4. Admin approves candidate
        approve_resp = client.post(f"/api/v1/admin/instructor-requests/{user_id}/approve", headers=admin_headers)
        assert approve_resp.status_code == 200
        appr_data = approve_resp.json()
        assert appr_data["role"] == "INSTRUCTOR"
        assert appr_data["approval_status"] == "APPROVED"
        assert appr_data["approved_at"] is not None

        # 5. Instructor can now access Instructor API!
        allowed_resp = client.get("/api/v1/auth/test/instructor", headers={"Authorization": f"Bearer {inst_token}"})
        assert allowed_resp.status_code == 200
        assert allowed_resp.json()["role"] == "INSTRUCTOR"

        # 6. Admin rejects instructor
        reject_resp = client.post(f"/api/v1/admin/instructor-requests/{user_id}/reject", headers=admin_headers)
        assert reject_resp.status_code == 200
        rej_data = reject_resp.json()
        assert rej_data["role"] == "STUDENT"
        assert rej_data["approval_status"] == "REJECTED"

        # 7. Rejected instructor is denied Instructor API access
        denied_resp = client.get("/api/v1/auth/test/instructor", headers={"Authorization": f"Bearer {inst_token}"})
        assert denied_resp.status_code == 403
        assert "Instructor application was rejected" in denied_resp.json()["detail"]

    finally:
        admin_user = db.scalar(select(User).where(User.email == settings.admin_email))
        if admin_user:
            admin_user.auth_user_id = None
            db.commit()
        _delete_temp_auth_user(db, admin_uuid, settings.admin_email)
        _delete_temp_auth_user(db, candidate_uuid, candidate_email)
        db.close()


def test_existing_admin_and_student_remain_intact():
    db = SessionLocal()
    try:
        admin = db.scalar(select(User).where(User.role == UserRole.ADMIN))
        assert admin is not None
        assert admin.approval_status == "APPROVED"

        student = db.scalar(select(User).where(User.role == UserRole.STUDENT, User.requested_role.is_(None)))
        if student:
            assert student.approval_status == "APPROVED"
    finally:
        db.close()
