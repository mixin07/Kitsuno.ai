import uuid

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.security import hash_password
from app.database import SessionLocal
from app.main import app
from app.models import Enrollment, LessonProgress, User, UserRole

client = TestClient(app)

BASE = "/api/v1"
PASSWORD = "TestPassword123!"


def _auth_header(user: User) -> dict[str, str]:
    response = client.post(
        f"{BASE}/auth/login", json={"email": user.email, "password": PASSWORD}
    )
    assert response.status_code == 200, "test login failed"
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _seed_student(name: str = "Learning Student") -> User:
    db = SessionLocal()
    try:
        user = User(
            name=name,
            email=f"learning_{uuid.uuid4().hex[:8]}@test.com",
            password_hash=hash_password(PASSWORD),
            role=UserRole.STUDENT,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def _create_course(user: User, **overrides) -> dict:
    payload = {"title": "Learning Course", **overrides}
    response = client.post(f"{BASE}/courses", json=payload, headers=_auth_header(user))
    assert response.status_code == 201, response.text
    return response.json()


def _create_module(user: User, course_id: int, title: str = "Module") -> dict:
    response = client.post(
        f"{BASE}/courses/{course_id}/modules",
        json={"title": title},
        headers=_auth_header(user),
    )
    assert response.status_code == 201, response.text
    return response.json()


def _create_lesson(
    user: User, course_id: int, module_id: int, order: int, title: str
) -> dict:
    response = client.post(
        f"{BASE}/courses/{course_id}/modules/{module_id}/lessons",
        json={"title": title, "order_number": order, "content": f"{title} body"},
        headers=_auth_header(user),
    )
    assert response.status_code == 201, response.text
    return response.json()


def _published_course(
    inst_a: User, lesson_counts: tuple[int, ...] = (1,)
) -> tuple[int, list[int]]:
    course = _create_course(inst_a)
    lesson_ids: list[int] = []
    for module_index, count in enumerate(lesson_counts, start=1):
        module = _create_module(inst_a, course["id"], title=f"Module {module_index}")
        for order in range(1, count + 1):
            lesson = _create_lesson(
                inst_a,
                course["id"],
                module["id"],
                order=order,
                title=f"M{module_index}L{order}",
            )
            lesson_ids.append(lesson["id"])
    publish = client.post(
        f"{BASE}/courses/{course['id']}/publish", headers=_auth_header(inst_a)
    )
    assert publish.status_code == 200, publish.text
    return course["id"], lesson_ids


def _enroll(student: User, course_id: int) -> dict:
    response = client.post(
        f"{BASE}/enrollments/{course_id}", headers=_auth_header(student)
    )
    assert response.status_code == 201, response.text
    return response.json()


def _complete_lesson(student: User, lesson_id: int, completed: bool = True) -> None:
    response = client.put(
        f"{BASE}/progress/lessons/{lesson_id}",
        json={"completed": completed},
        headers=_auth_header(student),
    )
    assert response.status_code == 200, response.text


# --------------------------------------------------------------------------
# Enrollment
# --------------------------------------------------------------------------


def test_student_enrolls_in_published_course(inst_a: User, student: User) -> None:
    course_id, _ = _published_course(inst_a, (1,))
    enrolled = _enroll(student, course_id)
    assert enrolled["student_id"] == student.id
    assert enrolled["course_id"] == course_id
    assert enrolled["progress"] == 0
    assert enrolled["completed_at"] is None
    assert "enrolled_at" in enrolled

    detail = client.get(
        f"{BASE}/enrollments/{course_id}", headers=_auth_header(student)
    )
    assert detail.status_code == 200
    body = detail.json()
    assert body["course"]["id"] == course_id
    assert body["total_lessons"] == 1
    assert body["progress"] == 0
    assert body["next_lesson"] is not None
    assert body["student_id"] == student.id


def test_student_cannot_enroll_twice(inst_a: User, student: User) -> None:
    course_id, _ = _published_course(inst_a, (1,))
    _enroll(student, course_id)
    response = client.post(
        f"{BASE}/enrollments/{course_id}", headers=_auth_header(student)
    )
    assert response.status_code == 409


def test_student_cannot_enroll_unpublished_course(inst_a: User, student: User) -> None:
    course = _create_course(inst_a)
    _create_module(inst_a, course["id"])
    response = client.post(
        f"{BASE}/enrollments/{course['id']}", headers=_auth_header(student)
    )
    assert response.status_code == 404


def test_student_cannot_enroll_missing_course(student: User) -> None:
    response = client.post(
        f"{BASE}/enrollments/999999", headers=_auth_header(student)
    )
    assert response.status_code == 404


def test_instructor_cannot_enroll(inst_a: User) -> None:
    course_id, _ = _published_course(inst_a, (1,))
    response = client.post(
        f"{BASE}/enrollments/{course_id}", headers=_auth_header(inst_a)
    )
    assert response.status_code == 403


def test_enroll_requires_authentication(inst_a: User) -> None:
    course_id, _ = _published_course(inst_a, (1,))
    assert client.post(f"{BASE}/enrollments/{course_id}").status_code == 401


def test_list_enrollments_with_details(inst_a: User) -> None:
    list_student = _seed_student("Enrolled Listing Student")
    course_a, lessons_a = _published_course(inst_a, (2,))
    course_b, _ = _published_course(inst_a, (1,))
    _enroll(list_student, course_a)
    _enroll(list_student, course_b)

    response = client.get(f"{BASE}/enrollments", headers=_auth_header(list_student))
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    by_course = {entry["course"]["id"]: entry for entry in body}
    assert by_course[course_a]["total_lessons"] == 2
    assert by_course[course_a]["next_lesson"]["id"] == lessons_a[0]
    assert by_course[course_b]["total_lessons"] == 1


def test_enrollments_isolated_between_students(inst_a: User) -> None:
    course_id, _ = _published_course(inst_a, (2,))
    student_a = _seed_student("Student A Enroll")
    student_b = _seed_student("Student B Enroll")
    _enroll(student_a, course_id)

    missing = client.get(
        f"{BASE}/enrollments/{course_id}", headers=_auth_header(student_b)
    )
    assert missing.status_code == 404

    listing = client.get(f"{BASE}/enrollments", headers=_auth_header(student_b))
    assert listing.status_code == 200
    assert listing.json() == []


def test_unenroll_removes_enrollment_and_progress(
    inst_a: User, student: User
) -> None:
    course_id, lessons = _published_course(inst_a, (1,))
    _enroll(student, course_id)
    _complete_lesson(student, lessons[0])

    response = client.delete(
        f"{BASE}/enrollments/{course_id}", headers=_auth_header(student)
    )
    assert response.status_code == 204

    gone = client.get(
        f"{BASE}/enrollments/{course_id}", headers=_auth_header(student)
    )
    assert gone.status_code == 404

    denied = client.put(
        f"{BASE}/progress/lessons/{lessons[0]}",
        json={"completed": True},
        headers=_auth_header(student),
    )
    assert denied.status_code == 403

    db = SessionLocal()
    try:
        assert db.scalar(
            select(Enrollment).where(
                Enrollment.student_id == student.id, Enrollment.course_id == course_id
            )
        ) is None
        assert db.scalar(
            select(LessonProgress).where(
                LessonProgress.student_id == student.id,
                LessonProgress.lesson_id == lessons[0],
            )
        ) is None
    finally:
        db.close()


def test_unenroll_missing_is_404(student: User) -> None:
    response = client.delete(
        f"{BASE}/enrollments/999999", headers=_auth_header(student)
    )
    assert response.status_code == 404


# --------------------------------------------------------------------------
# Progress
# --------------------------------------------------------------------------


def test_zero_lesson_course_progress_defaults(inst_a: User) -> None:
    course_id, _ = _published_course(inst_a, (0,))
    empty_student = _seed_student("Empty Course Student")
    _enroll(empty_student, course_id)

    progress = client.get(
        f"{BASE}/progress/courses/{course_id}", headers=_auth_header(empty_student)
    )
    assert progress.status_code == 200
    body = progress.json()
    assert body["total_lessons"] == 0
    assert body["completed_lessons"] == 0
    assert body["progress"] == 0
    assert body["completed"] is False
    assert body["next_lesson"] is None

    enrollments = client.get(f"{BASE}/enrollments", headers=_auth_header(empty_student))
    listing = enrollments.json()
    assert len(listing) == 1
    assert listing[0]["progress"] == 0
    assert listing[0]["total_lessons"] == 0


def test_lesson_progress_defaults_to_zero(inst_a: User, student: User) -> None:
    course_id, lessons = _published_course(inst_a, (1,))
    _enroll(student, course_id)
    response = client.get(
        f"{BASE}/progress/lessons/{lessons[0]}", headers=_auth_header(student)
    )
    assert response.status_code == 200
    body = response.json()
    assert body["completed"] is False
    assert body["watch_time"] == 0.0
    assert body["last_position"] == 0.0
    assert body["started_at"] is None
    assert body["completed_at"] is None
    assert body["id"] is None


def test_lesson_progress_requires_enrollment(inst_a: User) -> None:
    course_id, lessons = _published_course(inst_a, (1,))
    outsider = _seed_student("Not Enrolled")
    headers = _auth_header(outsider)

    assert client.get(
        f"{BASE}/progress/lessons/{lessons[0]}", headers=headers
    ).status_code == 403
    assert client.put(
        f"{BASE}/progress/lessons/{lessons[0]}",
        json={"completed": True},
        headers=headers,
    ).status_code == 403
    assert client.get(
        f"{BASE}/progress/courses/{course_id}", headers=headers
    ).status_code == 403


def test_lesson_progress_missing_lesson_is_404(inst_a: User, student: User) -> None:
    course_id, _ = _published_course(inst_a, (1,))
    _enroll(student, course_id)
    assert client.get(
        f"{BASE}/progress/lessons/999999", headers=_auth_header(student)
    ).status_code == 404


def test_lesson_progress_unpublished_course_404(inst_a: User, student: User) -> None:
    course_id, lessons = _published_course(inst_a, (1,))
    _enroll(student, course_id)
    client.post(
        f"{BASE}/courses/{course_id}/unpublish", headers=_auth_header(inst_a)
    )
    assert client.get(
        f"{BASE}/progress/lessons/{lessons[0]}", headers=_auth_header(student)
    ).status_code == 404


def test_update_watch_time_and_position(inst_a: User, student: User) -> None:
    course_id, lessons = _published_course(inst_a, (1,))
    _enroll(student, course_id)
    response = client.put(
        f"{BASE}/progress/lessons/{lessons[0]}",
        json={"watch_time": 10.5, "last_position": 5.25},
        headers=_auth_header(student),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["watch_time"] == 10.5
    assert body["last_position"] == 5.25
    assert body["completed"] is False
    assert body["started_at"] is not None


def test_negative_watch_time_rejected(inst_a: User, student: User) -> None:
    course_id, lessons = _published_course(inst_a, (1,))
    _enroll(student, course_id)
    response = client.put(
        f"{BASE}/progress/lessons/{lessons[0]}",
        json={"watch_time": -1},
        headers=_auth_header(student),
    )
    assert response.status_code == 422


def test_completing_lessons_updates_course_progress(
    inst_a: User, student: User
) -> None:
    course_id, lessons = _published_course(inst_a, (2,))

    def course_progress() -> dict:
        response = client.get(
            f"{BASE}/progress/courses/{course_id}", headers=_auth_header(student)
        )
        assert response.status_code == 200
        return response.json()

    _enroll(student, course_id)
    half = course_progress()
    assert half["total_lessons"] == 2
    assert half["completed_lessons"] == 0
    assert half["progress"] == 0
    assert half["next_lesson"] is not None

    _complete_lesson(student, lessons[0])
    half = course_progress()
    assert half["completed_lessons"] == 1
    assert half["progress"] == 50
    assert half["completed"] is False
    assert half["next_lesson"]["id"] == lessons[1]

    _complete_lesson(student, lessons[1])
    done = course_progress()
    assert done["completed_lessons"] == 2
    assert done["progress"] == 100
    assert done["completed"] is True
    assert done["next_lesson"] is None

    enrolled = client.get(
        f"{BASE}/enrollments/{course_id}", headers=_auth_header(student)
    ).json()
    assert enrolled["progress"] == 100
    assert enrolled["completed_at"] is not None

    _complete_lesson(student, lessons[1], completed=False)
    reopened = course_progress()
    assert reopened["progress"] == 50
    assert reopened["completed"] is False
    assert reopened["next_lesson"]["id"] == lessons[1]

    reopened_enrollment = client.get(
        f"{BASE}/enrollments/{course_id}", headers=_auth_header(student)
    ).json()
    assert reopened_enrollment["completed_at"] is None


def test_next_lesson_follows_module_then_lesson_order(
    inst_a: User, student: User
) -> None:
    course_id, lessons = _published_course(inst_a, (1, 2))
    _enroll(student, course_id)

    def next_lesson() -> int | None:
        response = client.get(
            f"{BASE}/progress/courses/{course_id}", headers=_auth_header(student)
        )
        return response.json()["next_lesson"]["id"] if response.json()["next_lesson"] else None

    assert next_lesson() == lessons[0]
    _complete_lesson(student, lessons[1])
    assert next_lesson() == lessons[0]
    _complete_lesson(student, lessons[0])
    _complete_lesson(student, lessons[2])
    assert next_lesson() is None


def test_course_progress_isolated_between_students(inst_a: User) -> None:
    course_id, lessons = _published_course(inst_a, (2,))
    student_a = _seed_student("Progress A")
    student_b = _seed_student("Progress B")
    _enroll(student_a, course_id)
    _enroll(student_b, course_id)
    _complete_lesson(student_a, lessons[0])

    b_progress = client.get(
        f"{BASE}/progress/courses/{course_id}", headers=_auth_header(student_b)
    ).json()
    assert b_progress["progress"] == 0
    assert b_progress["completed_lessons"] == 0

    a_progress = client.get(
        f"{BASE}/progress/courses/{course_id}", headers=_auth_header(student_a)
    ).json()
    assert a_progress["progress"] == 50
    assert a_progress["completed_lessons"] == 1


def test_instructor_cannot_access_progress(inst_a: User) -> None:
    course_id, lessons = _published_course(inst_a, (1,))
    headers = _auth_header(inst_a)
    assert client.get(
        f"{BASE}/progress/courses/{course_id}", headers=headers
    ).status_code == 403
    assert client.get(
        f"{BASE}/progress/lessons/{lessons[0]}", headers=headers
    ).status_code == 403


def test_progress_endpoints_require_authentication(inst_a: User) -> None:
    course_id, lessons = _published_course(inst_a, (1,))
    assert client.get(f"{BASE}/progress/courses/{course_id}").status_code == 401
    assert client.get(f"{BASE}/progress/lessons/{lessons[0]}").status_code == 401
    assert client.put(
        f"{BASE}/progress/lessons/{lessons[0]}", json={"completed": True}
    ).status_code == 401


def test_progress_persists_in_database(inst_a: User, student: User) -> None:
    course_id, lessons = _published_course(inst_a, (1,))
    _enroll(student, course_id)
    _complete_lesson(student, lessons[0])

    db = SessionLocal()
    try:
        enrollment = db.scalar(
            select(Enrollment).where(
                Enrollment.student_id == student.id, Enrollment.course_id == course_id
            )
        )
        assert enrollment is not None
        assert enrollment.progress == 100
        assert enrollment.completed_at is not None

        row = db.scalar(
            select(LessonProgress).where(
                LessonProgress.student_id == student.id,
                LessonProgress.lesson_id == lessons[0],
            )
        )
        assert row is not None
        assert row.completed is True
        assert row.completed_at is not None
        assert row.started_at is not None
    finally:
        db.close()


def test_regression_authentication_and_catalogue(inst_a: User, student: User) -> None:
    course = _create_course(inst_a, title="Regression Course")
    _create_module(inst_a, course["id"])
    client.post(f"{BASE}/courses/{course['id']}/publish", headers=_auth_header(inst_a))

    listing = client.get(f"{BASE}/courses", headers=_auth_header(student))
    assert listing.status_code == 200
    assert course["id"] in [c["id"] for c in listing.json()]

    assert client.get(f"{BASE}/courses").status_code == 401
    assert client.post(f"{BASE}/auth/login", json={}).status_code == 422