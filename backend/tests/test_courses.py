import uuid

from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.database import SessionLocal
from app.main import app
from app.models import Course, Lesson, Module, User

client = TestClient(app)

BASE = "/api/v1"
PASSWORD = "TestPassword123!"


def _auth_header(user: User) -> dict[str, str]:
    response = client.post(
        f"{BASE}/auth/login", json={"email": user.email, "password": PASSWORD}
    )
    assert response.status_code == 200, "test login failed"
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _create_course(user: User, **overrides) -> dict:
    payload = {"title": "Test Course", **overrides}
    response = client.post(f"{BASE}/courses", json=payload, headers=_auth_header(user))
    assert response.status_code == 201, response.text
    return response.json()


def _create_module(user: User, course_id: int, **overrides) -> dict:
    payload = {"title": "Test Module", **overrides}
    response = client.post(
        f"{BASE}/courses/{course_id}/modules", json=payload, headers=_auth_header(user)
    )
    assert response.status_code == 201, response.text
    return response.json()


def _create_lesson(user: User, course_id: int, module_id: int, **overrides) -> dict:
    payload = {"title": "Test Lesson", **overrides}
    response = client.post(
        f"{BASE}/courses/{course_id}/modules/{module_id}/lessons",
        json=payload,
        headers=_auth_header(user),
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_course_instructor_can_create(inst_a: User) -> None:
    course = _create_course(inst_a, title="Python Fundamentals")
    assert course["title"] == "Python Fundamentals"
    assert course["published"] is False
    assert "instructor_id" in course
    assert "id" in course


def test_course_assigned_to_authenticated_instructor(inst_a: User, inst_b: User) -> None:
    spoofed = _create_course(
        inst_a, title="Ownership Check", instructor_id=inst_b.id
    )
    assert spoofed["instructor_id"] == inst_a.id


def test_course_owner_retrieves_own_course(inst_a: User) -> None:
    created = _create_course(inst_a)
    response = client.get(
        f"{BASE}/courses/{created['id']}", headers=_auth_header(inst_a)
    )
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_course_owner_updates_own_course(inst_a: User) -> None:
    created = _create_course(inst_a)
    response = client.patch(
        f"{BASE}/courses/{created['id']}",
        json={"title": "Updated Title", "difficulty": "ADVANCED"},
        headers=_auth_header(inst_a),
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"
    assert response.json()["difficulty"] == "ADVANCED"


def test_course_publish_and_unpublish(inst_a: User) -> None:
    created = _create_course(inst_a)
    headers = _auth_header(inst_a)
    _create_module(inst_a, created["id"])

    publish = client.post(f"{BASE}/courses/{created['id']}/publish", headers=headers)
    assert publish.status_code == 200
    assert publish.json()["published"] is True

    unpublish = client.post(f"{BASE}/courses/{created['id']}/unpublish", headers=headers)
    assert unpublish.status_code == 200
    assert unpublish.json()["published"] is False


def test_course_cannot_publish_without_modules(inst_a: User) -> None:
    created = _create_course(inst_a)
    response = client.post(
        f"{BASE}/courses/{created['id']}/publish", headers=_auth_header(inst_a)
    )
    assert response.status_code == 409


def test_another_instructor_cannot_modify_course(inst_a: User, inst_b: User) -> None:
    created = _create_course(inst_a)
    response = client.patch(
        f"{BASE}/courses/{created['id']}",
        json={"title": "Hacked"},
        headers=_auth_header(inst_b),
    )
    assert response.status_code == 403

    delete = client.delete(f"{BASE}/courses/{created['id']}", headers=_auth_header(inst_b))
    assert delete.status_code == 403


def test_student_cannot_create_course(student: User) -> None:
    response = client.post(
        f"{BASE}/courses",
        json={"title": "Nope"},
        headers=_auth_header(student),
    )
    assert response.status_code == 403


def test_student_cannot_modify_course(inst_a: User, student: User) -> None:
    created = _create_course(inst_a)
    response = client.patch(
        f"{BASE}/courses/{created['id']}",
        json={"title": "Nope"},
        headers=_auth_header(student),
    )
    assert response.status_code == 403


def test_admin_can_manage_courses(inst_a: User, admin: User) -> None:
    created = _create_course(inst_a)
    admin_headers = _auth_header(admin)

    patch = client.patch(
        f"{BASE}/courses/{created['id']}", json={"title": "Admin Update"}, headers=admin_headers
    )
    assert patch.status_code == 200
    assert patch.json()["title"] == "Admin Update"

    _create_module(admin, created["id"])
    publish = client.post(f"{BASE}/courses/{created['id']}/publish", headers=admin_headers)
    assert publish.status_code == 200
    assert publish.json()["published"] is True

    own = _create_course(admin, title="Admin's Own Course")
    assert own["instructor_id"] == admin.id


def test_module_owner_can_create_update_delete(inst_a: User) -> None:
    course = _create_course(inst_a)
    headers = _auth_header(inst_a)

    created = _create_module(inst_a, course["id"], title="Module One")
    patch = client.patch(
        f"{BASE}/courses/{course['id']}/modules/{created['id']}",
        json={"title": "Module Updated"},
        headers=headers,
    )
    assert patch.status_code == 200
    assert patch.json()["title"] == "Module Updated"

    delete = client.delete(
        f"{BASE}/courses/{course['id']}/modules/{created['id']}", headers=headers
    )
    assert delete.status_code == 204


def test_another_instructor_cannot_modify_module(inst_a: User, inst_b: User) -> None:
    course = _create_course(inst_a)
    module = _create_module(inst_a, course["id"])
    response = client.patch(
        f"{BASE}/courses/{course['id']}/modules/{module['id']}",
        json={"title": "Hacked"},
        headers=_auth_header(inst_b),
    )
    assert response.status_code == 403


def test_student_cannot_modify_module(inst_a: User, student: User) -> None:
    course = _create_course(inst_a)
    module = _create_module(inst_a, course["id"])
    response = client.patch(
        f"{BASE}/courses/{course['id']}/modules/{module['id']}",
        json={"title": "Hacked"},
        headers=_auth_header(student),
    )
    assert response.status_code == 403


def test_modules_returned_in_order(inst_a: User) -> None:
    course = _create_course(inst_a)
    headers = _auth_header(inst_a)
    _create_module(inst_a, course["id"], title="Third", order_number=3)
    _create_module(inst_a, course["id"], title="First", order_number=1)
    _create_module(inst_a, course["id"], title="Second", order_number=2)

    response = client.get(f"{BASE}/courses/{course['id']}/modules", headers=headers)
    assert response.status_code == 200
    titles = [m["title"] for m in response.json()]
    assert titles == ["First", "Second", "Third"]


def test_module_order_auto_increments(inst_a: User) -> None:
    course = _create_course(inst_a)
    _create_module(inst_a, course["id"], title="Auto One")
    second = _create_module(inst_a, course["id"], title="Auto Two")
    assert second["order_number"] == 2


def test_lesson_owner_can_create_update_delete(inst_a: User) -> None:
    course = _create_course(inst_a)
    module = _create_module(inst_a, course["id"])
    headers = _auth_header(inst_a)

    created = _create_lesson(
        inst_a, course["id"], module["id"], title="Lesson One", content="Body text"
    )
    patch = client.patch(
        f"{BASE}/courses/{course['id']}/modules/{module['id']}/lessons/{created['id']}",
        json={"title": "Lesson Updated", "content": "New body"},
        headers=headers,
    )
    assert patch.status_code == 200
    assert patch.json()["title"] == "Lesson Updated"
    assert patch.json()["content"] == "New body"

    delete = client.delete(
        f"{BASE}/courses/{course['id']}/modules/{module['id']}/lessons/{created['id']}",
        headers=headers,
    )
    assert delete.status_code == 204


def test_another_instructor_cannot_modify_lesson(inst_a: User, inst_b: User) -> None:
    course = _create_course(inst_a)
    module = _create_module(inst_a, course["id"])
    lesson = _create_lesson(inst_a, course["id"], module["id"])
    response = client.patch(
        f"{BASE}/courses/{course['id']}/modules/{module['id']}/lessons/{lesson['id']}",
        json={"title": "Hacked"},
        headers=_auth_header(inst_b),
    )
    assert response.status_code == 403


def test_student_cannot_modify_lesson(inst_a: User, student: User) -> None:
    course = _create_course(inst_a)
    module = _create_module(inst_a, course["id"])
    lesson = _create_lesson(inst_a, course["id"], module["id"])
    response = client.patch(
        f"{BASE}/courses/{course['id']}/modules/{module['id']}/lessons/{lesson['id']}",
        json={"title": "Hacked"},
        headers=_auth_header(student),
    )
    assert response.status_code == 403


def test_lessons_returned_in_order(inst_a: User) -> None:
    course = _create_course(inst_a)
    module = _create_module(inst_a, course["id"])
    headers = _auth_header(inst_a)
    _create_lesson(inst_a, course["id"], module["id"], title="C", order_number=3)
    _create_lesson(inst_a, course["id"], module["id"], title="A", order_number=1)
    _create_lesson(inst_a, course["id"], module["id"], title="B", order_number=2)

    response = client.get(
        f"{BASE}/courses/{course['id']}/modules/{module['id']}/lessons", headers=headers
    )
    assert response.status_code == 200
    titles = [l["title"] for l in response.json()]
    assert titles == ["A", "B", "C"]


def test_student_sees_published_courses(inst_a: User, student: User) -> None:
    course = _create_course(inst_a)
    module = _create_module(inst_a, course["id"])
    _create_lesson(inst_a, course["id"], module["id"])
    client.post(f"{BASE}/courses/{course['id']}/publish", headers=_auth_header(inst_a))

    response = client.get(f"{BASE}/courses", headers=_auth_header(student))
    ids = [c["id"] for c in response.json()]
    assert course["id"] in ids


def test_student_cannot_see_other_instructors_unpublished(
    inst_a: User, student: User
) -> None:
    course = _create_course(inst_a)
    headers = _auth_header(student)

    listing = client.get(f"{BASE}/courses", headers=headers)
    assert course["id"] not in [c["id"] for c in listing.json()]

    detail = client.get(f"{BASE}/courses/{course['id']}", headers=headers)
    assert detail.status_code == 404


def test_owner_sees_own_unpublished_course(inst_a: User) -> None:
    course = _create_course(inst_a)
    response = client.get(
        f"{BASE}/courses/{course['id']}", headers=_auth_header(inst_a)
    )
    assert response.status_code == 200


def test_student_can_view_published_course_structure(inst_a: User, student: User) -> None:
    course = _create_course(inst_a)
    module = _create_module(inst_a, course["id"])
    lesson = _create_lesson(inst_a, course["id"], module["id"])
    client.post(f"{BASE}/courses/{course['id']}/publish", headers=_auth_header(inst_a))

    student_headers = _auth_header(student)
    modules = client.get(
        f"{BASE}/courses/{course['id']}/modules", headers=student_headers
    )
    lessons = client.get(
        f"{BASE}/courses/{course['id']}/modules/{module['id']}/lessons",
        headers=student_headers,
    )
    assert modules.status_code == 200
    assert lessons.status_code == 200
    assert lessons.json()[0]["id"] == lesson["id"]


def test_database_relationships_and_persistence(inst_a: User) -> None:
    course = _create_course(inst_a, title="Relationship Check")
    module = _create_module(inst_a, course["id"])
    lesson = _create_lesson(
        inst_a, course["id"], module["id"], title="Persisted Lesson"
    )

    db = SessionLocal()
    try:
        db_course = db.get(Course, course["id"])
        assert db_course is not None
        assert db_course.instructor_id == inst_a.id
        db_module = db.get(Module, module["id"])
        assert db_module is not None
        assert db_module.course_id == course["id"]
        db_lesson = db.get(Lesson, lesson["id"])
        assert db_lesson is not None
        assert db_lesson.module_id == module["id"]
        assert db_lesson.title == "Persisted Lesson"

        assert len(db_course.modules) >= 1
        assert len(db_module.lessons) >= 1
        assert db_lesson.module.course.id == course["id"]
        module_count = db.scalar(
            select(func.count(Module.id)).where(Module.course_id == course["id"])
        )
        assert module_count >= 1
    finally:
        db.close()


def test_course_delete_cascades_children(inst_a: User) -> None:
    course = _create_course(inst_a, title="Cascade Check")
    module = _create_module(inst_a, course["id"])
    lesson = _create_lesson(inst_a, course["id"], module["id"])

    response = client.delete(
        f"{BASE}/courses/{course['id']}", headers=_auth_header(inst_a)
    )
    assert response.status_code == 204

    db = SessionLocal()
    try:
        assert db.get(Course, course["id"]) is None
        assert db.get(Module, module["id"]) is None
        assert db.get(Lesson, lesson["id"]) is None
    finally:
        db.close()


def test_course_endpoints_require_authentication(inst_a: User) -> None:
    course = _create_course(inst_a)
    assert client.get(f"{BASE}/courses").status_code == 401
    assert client.get(f"{BASE}/courses/{course['id']}").status_code == 401
    assert client.post(f"{BASE}/courses", json={"title": "X"}).status_code == 401
    assert client.patch(f"{BASE}/courses/{course['id']}", json={"title": "X"}).status_code == 401
    assert client.delete(f"{BASE}/courses/{course['id']}").status_code == 401