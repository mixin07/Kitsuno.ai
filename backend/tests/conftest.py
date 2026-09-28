import pytest
from sqlalchemy import delete, select

from app.core.security import hash_password
from app.database import SessionLocal
from app.models import (
    Course,
    Enrollment,
    GameAttempt,
    GamificationLog,
    Lesson,
    LessonProgress,
    Module,
    User,
    UserAchievement,
    UserGamification,
    UserQuestProgress,
    UserRole,
)

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

        # Clean up student-related records
        db.execute(delete(GameAttempt).where(GameAttempt.user_id.in_(user_ids)))
        db.execute(delete(GamificationLog).where(GamificationLog.user_id.in_(user_ids)))
        db.execute(delete(UserQuestProgress).where(UserQuestProgress.user_id.in_(user_ids)))
        db.execute(delete(UserAchievement).where(UserAchievement.user_id.in_(user_ids)))
        db.execute(delete(UserGamification).where(UserGamification.user_id.in_(user_ids)))
        db.execute(delete(LessonProgress).where(LessonProgress.student_id.in_(user_ids)))
        db.execute(delete(Enrollment).where(Enrollment.student_id.in_(user_ids)))

        # Clean up courses created by test instructors
        course_ids = db.execute(
            select(Course.id).where(Course.instructor_id.in_(user_ids))
        ).scalars().all()
        if course_ids:
            db.execute(delete(Enrollment).where(Enrollment.course_id.in_(course_ids)))
            module_ids = db.execute(
                select(Module.id).where(Module.course_id.in_(course_ids))
            ).scalars().all()
            if module_ids:
                db.execute(delete(Lesson).where(Lesson.module_id.in_(module_ids)))
                db.execute(delete(Module).where(Module.id.in_(module_ids)))
            db.execute(delete(Course).where(Course.id.in_(course_ids)))

        db.execute(delete(User).where(User.id.in_(user_ids)))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()