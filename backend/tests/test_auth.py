import uuid

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.security import hash_password
from app.database import SessionLocal
from app.main import app
from app.models.user import User, UserRole

client = TestClient(app)

UNIQUE = uuid.uuid4().hex[:8]


def _register_student(email: str, password: str = "TestPassword123!") -> dict:
    return {
        "name": "Test Student",
        "email": email,
        "password": password,
    }


def _create_user_in_db(name: str, email: str, role: UserRole, password: str = "TestPassword123!") -> User:
    db = SessionLocal()
    try:
        user = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def _login(email: str, password: str) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return response


def test_health_endpoint_still_works() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_a_register_student() -> None:
    payload = _register_student(f"student_{UNIQUE}@test.com")
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["name"] == payload["name"]
    assert data["role"] == "STUDENT"
    assert "password_hash" not in data


def test_b_duplicate_email_rejected() -> None:
    email = f"dup_{UNIQUE}@test.com"
    payload = _register_student(email)
    first = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 409


def test_c_password_stored_hashed() -> None:
    email = f"hashcheck_{UNIQUE}@test.com"
    raw_password = "TestPassword123!"
    payload = _register_student(email, raw_password)
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201

    db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == email))
        assert user is not None
        assert user.password_hash != raw_password
        assert user.password_hash.startswith(b"$2b$".decode()) or user.password_hash.startswith("$2")
    finally:
        db.close()


def test_d_login_with_correct_credentials_succeeds() -> None:
    email = f"login_ok_{UNIQUE}@test.com"
    password = "TestPassword123!"
    client.post("/api/v1/auth/register", json=_register_student(email, password))
    response = _login(email, password)
    assert response.status_code == 200
    token = response.json()
    assert "access_token" in token
    assert token["token_type"] == "bearer"


def test_e_login_with_incorrect_credentials_fails() -> None:
    email = f"login_bad_{UNIQUE}@test.com"
    password = "TestPassword123!"
    client.post("/api/v1/auth/register", json=_register_student(email, password))
    response = _login(email, "WrongPassword123!")
    assert response.status_code == 401


def test_f_jwt_is_generated() -> None:
    email = f"jwt_{UNIQUE}@test.com"
    password = "TestPassword123!"
    client.post("/api/v1/auth/register", json=_register_student(email, password))
    response = _login(email, password)
    assert response.status_code == 200
    token = response.json()["access_token"]
    parts = token.split(".")
    assert len(parts) == 3


def test_g_me_works_with_valid_token() -> None:
    email = f"me_ok_{UNIQUE}@test.com"
    password = "TestPassword123!"
    client.post("/api/v1/auth/register", json=_register_student(email, password))
    token = _login(email, password).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == email
    assert "password_hash" not in response.json()


def test_h_me_fails_without_valid_token() -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

    bad_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.token.value"},
    )
    assert bad_response.status_code == 401


def test_i_rbac_checks() -> None:
    student_email = f"rbac_student_{UNIQUE}@test.com"
    instructor_email = f"rbac_instructor_{UNIQUE}@test.com"
    admin_email = f"rbac_admin_{UNIQUE}@test.com"
    password = "TestPassword123!"

    client.post("/api/v1/auth/register", json=_register_student(student_email, password))
    _create_user_in_db("Test Instructor", instructor_email, UserRole.INSTRUCTOR, password)
    _create_user_in_db("Test Admin", admin_email, UserRole.ADMIN, password)

    student_token = _login(student_email, password).json()["access_token"]
    instructor_token = _login(instructor_email, password).json()["access_token"]
    admin_token = _login(admin_email, password).json()["access_token"]

    student_auth = {"Authorization": f"Bearer {student_token}"}
    instructor_auth = {"Authorization": f"Bearer {instructor_token}"}
    admin_auth = {"Authorization": f"Bearer {admin_token}"}

    # student-only endpoint
    assert client.get("/api/v1/auth/test/student", headers=student_auth).status_code == 200
    assert client.get("/api/v1/auth/test/student", headers=instructor_auth).status_code == 403
    assert client.get("/api/v1/auth/test/student", headers=admin_auth).status_code == 403

    # instructor-only endpoint
    assert client.get("/api/v1/auth/test/instructor", headers=instructor_auth).status_code == 200
    assert client.get("/api/v1/auth/test/instructor", headers=student_auth).status_code == 403
    assert client.get("/api/v1/auth/test/instructor", headers=admin_auth).status_code == 403

    # admin-only endpoint
    assert client.get("/api/v1/auth/test/admin", headers=admin_auth).status_code == 200
    assert client.get("/api/v1/auth/test/admin", headers=student_auth).status_code == 403
    assert client.get("/api/v1/auth/test/admin", headers=instructor_auth).status_code == 403

    # unauthorized
    assert client.get("/api/v1/auth/test/admin").status_code == 401