import pytest
from fastapi.testclient import TestClient

from app.core.jwt import create_access_token
from app.database import SessionLocal
from app.main import app
from app.models import Course, Enrollment, Lesson, Module, User, UserRole

client = TestClient(app)


@pytest.fixture
def student_user():
    db = SessionLocal()
    user = db.query(User).filter_by(email="student_ai_test@test.com").first()
    if not user:
        user = User(
            email="student_ai_test@test.com",
            password_hash="hashed_password",
            name="AI Student",
            role=UserRole.STUDENT,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    db.close()
    return user


@pytest.fixture
def instructor_user():
    db = SessionLocal()
    user = db.query(User).filter_by(email="instructor_ai_test@test.com").first()
    if not user:
        user = User(
            email="instructor_ai_test@test.com",
            password_hash="hashed_password",
            name="AI Instructor",
            role=UserRole.INSTRUCTOR,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    db.close()
    return user


@pytest.fixture
def published_course(instructor_user):
    db = SessionLocal()
    course = db.query(Course).filter_by(title="AI Assistant Test Course").first()
    if not course:
        course = Course(
            title="AI Assistant Test Course",
            description="A course to test AI Study Assistant",
            category="Testing",
            instructor_id=instructor_user.id,
            published=True,
        )
        db.add(course)
        db.commit()
        db.refresh(course)

        module = Module(course_id=course.id, title="HTML Basics", order_number=1)
        db.add(module)
        db.commit()
        db.refresh(module)

        lesson = Lesson(
            module_id=module.id,
            title="Intro to Hyperlinks",
            description="Learn about <a> tags",
            content="Hyperlinks allow users to navigate between web pages using href attribute.",
            video_url="https://www.youtube.com/watch?v=test",
            order_number=1,
        )
        db.add(lesson)
        db.commit()
        db.refresh(lesson)
    else:
        module = db.query(Module).filter_by(course_id=course.id).first()
        lesson = db.query(Lesson).filter_by(module_id=module.id).first()

    db.close()
    return course, module, lesson


@pytest.fixture
def student_token(student_user):
    return create_access_token(subject=str(student_user.id))


def test_ai_assistant_unauthenticated():
    response = client.post("/api/v1/ai/study-assistant", json={"lesson_id": 1, "action": "CHAT"})
    assert response.status_code == 401


def test_ai_assistant_not_enrolled(student_token, published_course):
    _, _, lesson = published_course
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post(
        "/api/v1/ai/study-assistant",
        json={"lesson_id": lesson.id, "action": "CHAT", "message": "What is a hyperlink?"},
        headers=headers,
    )
    assert response.status_code == 403
    assert "Enroll" in response.json()["detail"]


def test_ai_assistant_success_chat(student_user, student_token, published_course):
    course, _, lesson = published_course
    db = SessionLocal()
    existing = db.query(Enrollment).filter_by(student_id=student_user.id, course_id=course.id).first()
    if not existing:
        enrollment = Enrollment(student_id=student_user.id, course_id=course.id, progress=0)
        db.add(enrollment)
        db.commit()
    db.close()

    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post(
        "/api/v1/ai/study-assistant",
        json={"lesson_id": lesson.id, "action": "CHAT", "message": "How do I use href?"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["lesson_id"] == lesson.id
    assert data["action"] == "CHAT"
    assert "reply" in data and len(data["reply"]) > 0


def test_ai_assistant_quick_action_explain(student_user, student_token, published_course):
    course, _, lesson = published_course
    db = SessionLocal()
    existing = db.query(Enrollment).filter_by(student_id=student_user.id, course_id=course.id).first()
    if not existing:
        enrollment = Enrollment(student_id=student_user.id, course_id=course.id, progress=0)
        db.add(enrollment)
        db.commit()
    db.close()

    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post(
        "/api/v1/ai/study-assistant",
        json={"lesson_id": lesson.id, "action": "EXPLAIN"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["action"] == "EXPLAIN"
    assert "explanation" in data["reply"].lower() or "lesson" in data["reply"].lower()


def test_ai_assistant_quick_action_quiz_me(student_user, student_token, published_course):
    course, _, lesson = published_course
    db = SessionLocal()
    existing = db.query(Enrollment).filter_by(student_id=student_user.id, course_id=course.id).first()
    if not existing:
        enrollment = Enrollment(student_id=student_user.id, course_id=course.id, progress=0)
        db.add(enrollment)
        db.commit()
    db.close()

    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post(
        "/api/v1/ai/study-assistant",
        json={"lesson_id": lesson.id, "action": "QUIZ_ME"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["action"] == "QUIZ_ME"
    assert "question" in data["reply"].lower() or "practice" in data["reply"].lower()


def test_ai_assistant_invalid_lesson(student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    response = client.post(
        "/api/v1/ai/study-assistant",
        json={"lesson_id": 999999, "action": "CHAT", "message": "Test"},
        headers=headers,
    )
    assert response.status_code == 404
