from fastapi.testclient import TestClient

from app.core.jwt import create_access_token
from app.main import app
from app.models import User

client = TestClient(app)

BASE = "/api/v1"


def _auth_header(user: User) -> dict[str, str]:
    token = create_access_token(subject=str(user.id))
    return {"Authorization": f"Bearer {token}"}


def _create_published_course_with_lesson(instructor: User) -> tuple[dict, dict]:
    headers = _auth_header(instructor)
    c_res = client.post(f"{BASE}/courses", json={"title": "AI Course"}, headers=headers)
    course = c_res.json()

    m_res = client.post(
        f"{BASE}/courses/{course['id']}/modules",
        json={"title": "Module 1", "order_number": 1},
        headers=headers,
    )
    mod1 = m_res.json()

    l_res = client.post(
        f"{BASE}/courses/{course['id']}/modules/{mod1['id']}/lessons",
        json={
            "title": "JavaScript Closures",
            "order_number": 1,
            "content": "A closure is the combination of a function bundled together with references to its surrounding state.",
        },
        headers=headers,
    )
    lesson = l_res.json()

    p_res = client.post(f"{BASE}/courses/{course['id']}/publish", headers=headers)
    assert p_res.status_code == 200
    return course, lesson


# --- Global AI Chat Tests ---

def test_ai_chat_unauthenticated():
    res = client.post(f"{BASE}/ai/chat", json={"message": "Hello"})
    assert res.status_code == 401


def test_ai_chat_success(student: User):
    headers = _auth_header(student)
    res = client.post(
        f"{BASE}/ai/chat",
        json={
            "message": "What is the difference between let and const?",
            "conversation": [
                {"role": "user", "content": "Hi"},
                {"role": "assistant", "content": "Hello! How can I help you learn?"},
            ],
        },
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data["reply"]) > 0


def test_ai_chat_with_lesson_context(inst_a: User, student: User):
    course, lesson = _create_published_course_with_lesson(inst_a)
    s_headers = _auth_header(student)

    # Enroll student
    client.post(f"{BASE}/enrollments/{course['id']}", headers=s_headers)

    res = client.post(
        f"{BASE}/ai/chat",
        json={
            "message": "Can you explain closures simply?",
            "lesson_id": lesson["id"],
        },
        headers=s_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["lesson_title"] == "JavaScript Closures"
    assert "reply" in data


def test_ai_chat_unauthorized_lesson_context(inst_b: User, inst_a: User):
    course, lesson = _create_published_course_with_lesson(inst_a)
    headers = _auth_header(inst_b)

    # inst_b is an instructor, not enrolled -> should fail with 403
    res = client.post(
        f"{BASE}/ai/chat",
        json={
            "message": "Explain this lesson",
            "lesson_id": lesson["id"],
        },
        headers=headers,
    )
    assert res.status_code == 403


# --- AI Lesson Summary Tests ---

def test_ai_lesson_summary_success(inst_a: User, student: User):
    course, lesson = _create_published_course_with_lesson(inst_a)
    s_headers = _auth_header(student)

    client.post(f"{BASE}/enrollments/{course['id']}", headers=s_headers)

    res = client.post(f"{BASE}/ai/lessons/{lesson['id']}/summary", headers=s_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["lesson_id"] == lesson["id"]
    assert "summary" in data
    assert isinstance(data["key_concepts"], list)
    assert isinstance(data["takeaways"], list)


def test_ai_lesson_summary_unauthorized(inst_a: User, inst_b: User):
    _course, lesson = _create_published_course_with_lesson(inst_a)

    res = client.post(f"{BASE}/ai/lessons/{lesson['id']}/summary", headers=_auth_header(inst_b))
    assert res.status_code == 403


# --- AI Study Notes Tests ---

def test_ai_lesson_notes_success(inst_a: User, student: User):
    course, lesson = _create_published_course_with_lesson(inst_a)
    s_headers = _auth_header(student)

    client.post(f"{BASE}/enrollments/{course['id']}", headers=s_headers)

    res = client.post(f"{BASE}/ai/lessons/{lesson['id']}/notes", headers=s_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["lesson_id"] == lesson["id"]
    assert data["topic"] == lesson["title"]
    assert isinstance(data["core_concepts"], list)
    assert isinstance(data["definitions"], list)
    assert isinstance(data["examples"], list)
    assert isinstance(data["common_mistakes"], list)
    assert isinstance(data["quick_revision"], list)


def test_ai_lesson_notes_unauthorized(inst_a: User, inst_b: User):
    _course, lesson = _create_published_course_with_lesson(inst_a)

    res = client.post(f"{BASE}/ai/lessons/{lesson['id']}/notes", headers=_auth_header(inst_b))
    assert res.status_code == 403
