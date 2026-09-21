import pytest
from sqlalchemy import delete, select

from app.core.security import hash_password
from app.database import SessionLocal
from app.models import Course, Lesson, Module, User, UserRole

TEST_PASSWORD = "TestPassword123!"


def _make_email(prefix: str) -> str:
    import uuid

    return f"{prefix}_{uuid.uuid4().hex[:8]}@test.com"


def _create_db_user(name: str, role: UserRole) -> User:
    db = SessionLocal()
    try:
        user = User(
            name=name,
            email=_make_email(role.name.lower()),
            password_hash=hash_password(TEST_PASSWORD),
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


@pytest.fixture(scope="module")
def student() -> User:
    return _create_db_user("Test Student", UserRole.STUDENT)


@pytest.fixture(scope="module")
def inst_a() -> User:
    return _create_db_user("Test Instructor A", UserRole.INSTRUCTOR)


@pytest.fixture(scope="module")
def inst_b() -> User:
    return _create_db_user("Test Instructor B", UserRole.INSTRUCTOR)


@pytest.fixture(scope="module")
def admin() -> User:
    return _create_db_user("Test Admin", UserRole.ADMIN)


@pytest.fixture(scope="session", autouse=True)
def _cleanup_test_data():
    yield
    db = SessionLocal()
    try:
        user_ids = db.execute(
            select(User.id).where(User.email.like("%@test.com"))
        ).scalars().all()
        if not user_ids:
            return
        course_ids = select(Course.id).where(Course.instructor_id.in_(user_ids))
        module_ids = select(Module.id).where(Module.course_id.in_(course_ids))
        db.execute(delete(Lesson).where(Lesson.module_id.in_(module_ids)))
        db.execute(delete(Module).where(Module.course_id.in_(course_ids)))
        db.execute(delete(Course).where(Course.instructor_id.in_(user_ids)))
        db.execute(delete(User).where(User.id.in_(user_ids)))
        db.commit()
    finally:
        db.close()