import time
import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import select, text

from app.config import settings
from app.database import SessionLocal
from app.main import app
from app.models.user import User, UserRole

client = TestClient(app)


def _mint_supabase_token(
    sub: str,
    email: str | None = None,
    name: str | None = None,
    expires_in_seconds: int = 3600,
    secret: str | None = None,
    audience: str = "authenticated",
) -> str:
    key = secret or settings.supabase_jwt_secret or settings.jwt_secret_key
    exp = int(time.time()) + expires_in_seconds
    payload = {
        "sub": sub,
        "email": email,
        "aud": audience,
        "iss": f"{settings.supabase_url.rstrip('/')}/auth/v1",
        "exp": exp,
        "user_metadata": {"name": name} if name else {},
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


def test_supabase_valid_jwt_and_me():
    db = SessionLocal()
    try:
        # Check an existing migrated user (Shahid or Mikasa)
        user = db.scalar(select(User).where(User.auth_user_id.isnot(None)))
        assert user is not None, "At least one migrated user with auth_user_id should exist"

        token = _mint_supabase_token(sub=str(user.auth_user_id), email=user.email, name=user.name)
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.get("/api/v1/auth/me", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == user.id
        assert data["email"] == user.email
        assert data["role"] == user.role.value
        assert data["auth_user_id"] == str(user.auth_user_id)
        assert "password_hash" not in data
    finally:
        db.close()


def test_supabase_invalid_jwt_signature():
    token = _mint_supabase_token(
        sub=str(uuid.uuid4()),
        email="fake@test.com",
        secret="completely-wrong-secret-key-that-fails-verification",
    )
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/v1/auth/me", headers=headers)
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Could not validate credentials"


def test_supabase_expired_jwt():
    token = _mint_supabase_token(
        sub=str(uuid.uuid4()),
        email="expired@test.com",
        expires_in_seconds=-3600,  # Expired 1 hour ago
    )
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get("/api/v1/auth/me", headers=headers)
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Could not validate credentials"


def test_supabase_malformed_jwt():
    headers = {"Authorization": "Bearer not.a.valid.jwt.token"}
    resp = client.get("/api/v1/auth/me", headers=headers)
    assert resp.status_code == 401


def test_supabase_unknown_auth_user_auto_provisions_as_student():
    db = SessionLocal()
    test_uuid = uuid.uuid4()
    test_email = f"auto_prov_{uuid.uuid4().hex[:8]}@example.com"
    test_name = "Auto Provisioned Student"

    # Pre-provision in auth.users (simulating Supabase Auth signup)
    _create_temp_auth_user(db, test_uuid, test_email, test_name)

    try:
        token = _mint_supabase_token(sub=str(test_uuid), email=test_email, name=test_name)
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.get("/api/v1/auth/me", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == test_email
        assert data["name"] == test_name
        assert data["role"] == "STUDENT"  # Safe default role!
        assert data["auth_user_id"] == str(test_uuid)

        # Verify persisted in database
        saved = db.scalar(select(User).where(User.auth_user_id == test_uuid))
        assert saved is not None
        assert saved.role == UserRole.STUDENT

        # Clean up test user in public.users
        db.delete(saved)
        db.commit()
    finally:
        _delete_temp_auth_user(db, test_uuid)
        db.close()


def test_supabase_inactive_user_rejected():
    db = SessionLocal()
    test_uuid = uuid.uuid4()
    test_email = f"inactive_{uuid.uuid4().hex[:8]}@example.com"

    _create_temp_auth_user(db, test_uuid, test_email, "Inactive User")
    user = User(
        name="Inactive User",
        email=test_email,
        auth_user_id=test_uuid,
        role=UserRole.STUDENT,
        is_active=False,
    )
    db.add(user)
    db.commit()

    try:
        token = _mint_supabase_token(sub=str(test_uuid), email=test_email)
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.get("/api/v1/auth/me", headers=headers)
        assert resp.status_code == 403
        assert resp.json()["detail"] == "Inactive user"
    finally:
        db.delete(user)
        db.commit()
        _delete_temp_auth_user(db, test_uuid)
        db.close()


def test_supabase_admin_google_oauth_linking():
    db = SessionLocal()
    admin_uuid = uuid.uuid4()
    admin_email = settings.admin_email  # jeyavelan68@gmail.com

    _create_temp_auth_user(db, admin_uuid, admin_email, "Mirudhula Admin")

    try:
        # Check that existing public.users admin record is linked
        token = _mint_supabase_token(sub=str(admin_uuid), email=admin_email, name="Mirudhula Admin")
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.get("/api/v1/auth/me", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == admin_email
        assert data["role"] == "ADMIN"
        assert data["auth_user_id"] == str(admin_uuid)

        # Admin access test
        admin_resp = client.get("/api/v1/auth/test/admin", headers=headers)
        assert admin_resp.status_code == 200

        # Cannot access student-only endpoint
        student_resp = client.get("/api/v1/auth/test/student", headers=headers)
        assert student_resp.status_code == 403
    finally:
        # Reset admin auth_user_id back to None for real Google OAuth later
        admin_user = db.scalar(select(User).where(User.email == admin_email))
        if admin_user:
            admin_user.auth_user_id = None
            db.commit()
        _delete_temp_auth_user(db, admin_uuid)
        db.close()


def test_supabase_arbitrary_google_user_cannot_become_admin():
    db = SessionLocal()
    arbitrary_uuid = uuid.uuid4()
    arbitrary_email = f"stranger_{uuid.uuid4().hex[:8]}@gmail.com"

    _create_temp_auth_user(db, arbitrary_uuid, arbitrary_email, "Stranger")

    try:
        token = _mint_supabase_token(sub=str(arbitrary_uuid), email=arbitrary_email, name="Stranger")
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.get("/api/v1/auth/me", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "STUDENT"  # Must NOT be ADMIN

        # Stranger cannot access admin endpoint
        admin_resp = client.get("/api/v1/auth/test/admin", headers=headers)
        assert admin_resp.status_code == 403

        # Clean up
        saved = db.scalar(select(User).where(User.auth_user_id == arbitrary_uuid))
        if saved:
            db.delete(saved)
            db.commit()
    finally:
        _delete_temp_auth_user(db, arbitrary_uuid)
        db.close()


def test_supabase_role_isolation():
    db = SessionLocal()
    try:
        # Use existing production users: Shahid (Instructor) and Mikasa (Student)
        instructor = db.scalar(select(User).where(User.email == "sm7510@srmist.edu.in"))
        student = db.scalar(select(User).where(User.email == "mj0971@gmail.com"))

        assert instructor is not None and instructor.auth_user_id is not None
        assert student is not None and student.auth_user_id is not None

        student_token = _mint_supabase_token(sub=str(student.auth_user_id), email=student.email)
        instructor_token = _mint_supabase_token(sub=str(instructor.auth_user_id), email=instructor.email)

        stu_headers = {"Authorization": f"Bearer {student_token}"}
        inst_headers = {"Authorization": f"Bearer {instructor_token}"}

        # Student endpoint
        assert client.get("/api/v1/auth/test/student", headers=stu_headers).status_code == 200
        assert client.get("/api/v1/auth/test/student", headers=inst_headers).status_code == 403

        # Instructor endpoint
        assert client.get("/api/v1/auth/test/instructor", headers=inst_headers).status_code == 200
        assert client.get("/api/v1/auth/test/instructor", headers=stu_headers).status_code == 403

        # Both cannot access admin endpoint
        assert client.get("/api/v1/auth/test/admin", headers=stu_headers).status_code == 403
        assert client.get("/api/v1/auth/test/admin", headers=inst_headers).status_code == 403
    finally:
        db.close()


def test_three_accounts_access_matrix():
    """Verify all 3 retained production roles adhere to strict role isolation."""
    db = SessionLocal()
    admin_uuid = uuid.uuid4()
    admin_email = settings.admin_email

    _create_temp_auth_user(db, admin_uuid, admin_email, "Mirudhula Admin")

    try:
        # Load production accounts
        instructor = db.scalar(select(User).where(User.email == "sm7510@srmist.edu.in"))
        student = db.scalar(select(User).where(User.email == "mj0971@gmail.com"))

        assert instructor and instructor.auth_user_id
        assert student and student.auth_user_id

        # Mint tokens for all 3 users
        student_token = _mint_supabase_token(sub=str(student.auth_user_id), email=student.email)
        instructor_token = _mint_supabase_token(sub=str(instructor.auth_user_id), email=instructor.email)
        admin_token = _mint_supabase_token(sub=str(admin_uuid), email=admin_email)

        stu_h = {"Authorization": f"Bearer {student_token}"}
        inst_h = {"Authorization": f"Bearer {instructor_token}"}
        admin_h = {"Authorization": f"Bearer {admin_token}"}

        # 1. First link Admin via /me
        admin_me = client.get("/api/v1/auth/me", headers=admin_h)
        assert admin_me.status_code == 200
        assert admin_me.json()["role"] == "ADMIN"
        assert admin_me.json()["id"] == 81  # Canonical Admin ID

        # 2. Student route (/api/v1/auth/test/student)
        assert client.get("/api/v1/auth/test/student", headers=stu_h).status_code == 200
        assert client.get("/api/v1/auth/test/student", headers=inst_h).status_code == 403
        assert client.get("/api/v1/auth/test/student", headers=admin_h).status_code == 403

        # 3. Instructor route (/api/v1/auth/test/instructor)
        assert client.get("/api/v1/auth/test/instructor", headers=inst_h).status_code == 200
        assert client.get("/api/v1/auth/test/instructor", headers=stu_h).status_code == 403
        assert client.get("/api/v1/auth/test/instructor", headers=admin_h).status_code == 403

        # 4. Admin route (/api/v1/auth/test/admin)
        assert client.get("/api/v1/auth/test/admin", headers=admin_h).status_code == 200
        assert client.get("/api/v1/auth/test/admin", headers=stu_h).status_code == 403
        assert client.get("/api/v1/auth/test/admin", headers=inst_h).status_code == 403

    finally:
        # Reset admin auth_user_id back to None for real OAuth
        admin_user = db.scalar(select(User).where(User.email == admin_email))
        if admin_user:
            admin_user.auth_user_id = None
            db.commit()
        _delete_temp_auth_user(db, admin_uuid)
        db.close()


def test_missing_token_rejected():
    """Verify unauthenticated requests fail with 401."""
    assert client.get("/api/v1/auth/me").status_code == 401
    assert client.get("/api/v1/auth/test/student").status_code == 401
    assert client.get("/api/v1/auth/test/instructor").status_code == 401
    assert client.get("/api/v1/auth/test/admin").status_code == 401

