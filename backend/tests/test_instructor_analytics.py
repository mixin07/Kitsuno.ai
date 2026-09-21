import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.database import SessionLocal
from app.main import app
from app.models import Option, Question, Quiz, QuizAttempt, User, UserRole

client = TestClient(app)

BASE = "/api/v1"
PASSWORD = "TestPassword123!"


def _auth_header(user: User) -> dict[str, str]:
    response = client.post(
        f"{BASE}/auth/login", json={"email": user.email, "password": PASSWORD}
    )
    assert response.status_code == 200, "test login failed"
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _seed_student(name: str) -> User:
    db = SessionLocal()
    try:
        user = User(
            name=name,
            email=f"inst_analytics_{uuid.uuid4().hex[:8]}@test.com",
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
    payload = {"title": "Instructor Analytics Course", **overrides}
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


def _create_lesson(user: User, course_id: int, module_id: int, order: int, title: str) -> dict:
    response = client.post(
        f"{BASE}/courses/{course_id}/modules/{module_id}/lessons",
        json={"title": title, "order_number": order, "content": f"{title} body"},
        headers=_auth_header(user),
    )
    assert response.status_code == 201, response.text
    return response.json()


def _build_course(
    inst: User, course_title: str, lesson_titles: list[str], publish: bool = True
) -> tuple[int, list[int]]:
    course = _create_course(inst, title=course_title)
    module = _create_module(inst, course["id"], title=f"{course_title} Module")
    lesson_ids: list[int] = []
    for order, title in enumerate(lesson_titles, start=1):
        lesson = _create_lesson(inst, course["id"], module["id"], order, title)
        lesson_ids.append(lesson["id"])
    if publish:
        response = client.post(
            f"{BASE}/courses/{course['id']}/publish", headers=_auth_header(inst)
        )
        assert response.status_code == 200, response.text
    return course["id"], lesson_ids


def _enroll(student: User, course_id: int) -> None:
    response = client.post(
        f"{BASE}/enrollments/{course_id}", headers=_auth_header(student)
    )
    assert response.status_code == 201, response.text


def _complete_lesson(student: User, lesson_id: int) -> None:
    response = client.put(
        f"{BASE}/progress/lessons/{lesson_id}",
        json={"completed": True},
        headers=_auth_header(student),
    )
    assert response.status_code == 200, response.text


def _seed_quiz(lesson_id: int, title: str) -> dict:
    db = SessionLocal()
    try:
        quiz = Quiz(lesson_id=lesson_id, title=title, description="auto quiz")
        db.add(quiz)
        db.flush()
        question = Question(
            quiz_id=quiz.id, question_text="Test?", points=1, order_index=1
        )
        db.add(question)
        db.flush()
        db.add(Option(question_id=question.id, option_text="A", is_correct=True, order_index=1))
        db.add(Option(question_id=question.id, option_text="B", is_correct=False, order_index=2))
        db.commit()
        return {"id": quiz.id, "title": title}
    finally:
        db.close()


def _seed_attempt(student_id: int, quiz_id: int, percentage: float, completed_at=None) -> None:
    db = SessionLocal()
    try:
        attempt = QuizAttempt(
            quiz_id=quiz_id,
            student_id=student_id,
            score=0.0,
            total_points=0.0,
            percentage=percentage,
            completed_at=completed_at,
        )
        db.add(attempt)
        db.commit()
    finally:
        db.close()


# --------------------------------------------------------------------------
# Security / RBAC
# --------------------------------------------------------------------------


def test_instructor_analytics_requires_authentication(inst_a: User) -> None:
    course_id, _ = _build_course(inst_a, "Auth Course", ["A1"])
    assert client.get(f"{BASE}/analytics/instructor").status_code == 401
    assert client.get(f"{BASE}/analytics/instructor/courses/{course_id}").status_code == 401


def test_student_cannot_access_instructor_analytics(inst_a: User) -> None:
    course_id, _ = _build_course(inst_a, "Student Blocked Course", ["S1"])
    student = _seed_student("Blocked Student")
    headers = _auth_header(student)
    assert client.get(f"{BASE}/analytics/instructor", headers=headers).status_code == 403
    assert client.get(
        f"{BASE}/analytics/instructor/courses/{course_id}", headers=headers
    ).status_code == 403


def test_instructor_cannot_access_other_instructors_course(inst_b: User) -> None:
    course_id, _ = _build_course(inst_b, "Instructor B Course", ["B1"])
    own_course_id, _ = _build_course(inst_b, "Instructor B Own", ["B2"])

    inst_a = _seed_student_only_instructor()
    headers = _auth_header(inst_a)
    assert client.get(
        f"{BASE}/analytics/instructor/courses/{course_id}", headers=headers
    ).status_code == 403
    assert client.get(
        f"{BASE}/analytics/instructor/courses/{own_course_id}", headers=headers
    ).status_code == 403


def _seed_student_only_instructor() -> User:
    db = SessionLocal()
    try:
        user = User(
            name="Analytics Only Instructor",
            email=f"inst_owner_{uuid.uuid4().hex[:8]}@test.com",
            password_hash=hash_password(PASSWORD),
            role=UserRole.INSTRUCTOR,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def test_admin_can_access_any_course(inst_a: User, admin: User) -> None:
    course_id, _ = _build_course(inst_a, "Admin Visible Course", ["AV1"])
    headers = _auth_header(admin)
    response = client.get(
        f"{BASE}/analytics/instructor/courses/{course_id}", headers=headers
    )
    assert response.status_code == 200
    assert response.json()["course_id"] == course_id
    listing = client.get(f"{BASE}/analytics/instructor", headers=headers)
    assert listing.status_code == 200
    assert course_id in [item["course_id"] for item in listing.json()]


def test_course_not_found_is_404(inst_a: User) -> None:
    response = client.get(
        f"{BASE}/analytics/instructor/courses/999999", headers=_auth_header(inst_a)
    )
    assert response.status_code == 404


def test_instructor_list_only_contains_own_courses(inst_a: User, inst_b: User) -> None:
    _build_course(inst_a, "Owned Course A", ["OA1"])
    _build_course(inst_b, "Foreign Course B", ["OB1"])

    response = client.get(f"{BASE}/analytics/instructor", headers=_auth_header(inst_a))
    assert response.status_code == 200
    titles = [item["course_title"] for item in response.json()]
    assert "Owned Course A" in titles
    assert "Foreign Course B" not in titles


def test_no_client_controlled_instructor_id(inst_a: User, inst_b: User) -> None:
    _build_course(inst_a, "Param Owned Course", ["P1"])
    foreign_id, _ = _build_course(inst_b, "Param Foreign Course", ["P2"])

    plain = client.get(f"{BASE}/analytics/instructor", headers=_auth_header(inst_a)).json()
    spoofed = client.get(
        f"{BASE}/analytics/instructor?instructor_id={inst_b.id}", headers=_auth_header(inst_a)
    ).json()
    assert plain == spoofed
    assert all(item["course_id"] != foreign_id for item in plain)


# --------------------------------------------------------------------------
# Data verification
# --------------------------------------------------------------------------


def _build_analytics_dataset():
    student1 = _seed_student("Analytics S1")
    student2 = _seed_student("Analytics S2")
    student3 = _seed_student("Analytics S3")
    return student1, student2, student3


def test_instructor_course_analytics_full_data(inst_a: User) -> None:
    student1, student2, _ = _build_analytics_dataset()

    course_id, lessons = _build_course(inst_a, "Analytics Course A", ["L1", "L2"])
    quiz = _seed_quiz(lessons[0], title="Lesson 1 Quiz")

    _enroll(student1, course_id)
    _complete_lesson(student1, lessons[0])
    _complete_lesson(student1, lessons[1])

    _enroll(student2, course_id)
    _complete_lesson(student2, lessons[0])

    now = datetime.now(timezone.utc)
    _seed_attempt(student1.id, quiz["id"], percentage=80.0, completed_at=now)
    _seed_attempt(student1.id, quiz["id"], percentage=100.0, completed_at=now)
    _seed_attempt(student2.id, quiz["id"], percentage=60.0, completed_at=now)
    _seed_attempt(student2.id, quiz["id"], percentage=0.0, completed_at=None)

    response = client.get(
        f"{BASE}/analytics/instructor/courses/{course_id}", headers=_auth_header(inst_a)
    )
    assert response.status_code == 200
    body = response.json()

    # Course identity
    assert body["course_id"] == course_id
    assert body["course_title"] == "Analytics Course A"
    assert body["published"] is True

    # Course summary
    summary = body["summary"]
    assert summary["total_enrolled"] == 2
    assert summary["completed_students"] == 1
    assert summary["active_students"] == 1
    assert summary["average_progress"] == 75.0
    assert summary["completion_rate"] == 50.0
    assert summary["total_lessons"] == 2
    assert summary["completed_lesson_activity"] == 3
    assert summary["total_quiz_attempts"] == 3
    assert summary["average_quiz_score"] == 80.0

    # Course progress info
    progress = body["progress"]
    assert progress["total_enrolled"] == 2
    assert progress["average_progress"] == 75.0
    assert progress["min_progress"] == 50
    assert progress["max_progress"] == 100
    assert progress["completed_students"] == 1
    assert progress["active_students"] == 1
    assert progress["completion_percentage"] == 50.0
    buckets = {b["bucket"]: b["students"] for b in progress["progress_buckets"]}
    assert buckets == {"0-25%": 0, "26-50%": 1, "51-75%": 0, "76-100%": 1}

    # Lesson analytics
    by_lesson = {item["lesson_id"]: item for item in body["lesson_analytics"]}
    assert set(by_lesson.keys()) == set(lessons)
    l1 = by_lesson[lessons[0]]
    assert l1["lesson_title"] == "L1"
    assert l1["students_started"] == 2
    assert l1["students_completed"] == 2
    assert l1["completion_percentage"] == 100.0
    l2 = by_lesson[lessons[1]]
    assert l2["students_started"] == 1
    assert l2["students_completed"] == 1
    assert l2["completion_percentage"] == 50.0

    # Quiz analytics
    assert len(body["quiz_analytics"]) == 1
    q = body["quiz_analytics"][0]
    assert q["quiz_title"] == "Lesson 1 Quiz"
    assert q["total_attempts"] == 4
    assert q["unique_students"] == 2
    assert q["average_score"] == 80.0
    assert q["best_score"] == 100.0
    assert q["lowest_score"] == 60.0
    assert q["completion_rate"] == 75.0

    # Student performance
    by_student = {item["student_id"]: item for item in body["student_performance"]}
    s1 = by_student[student1.id]
    assert s1["student_name"] == "Analytics S1"
    assert s1["course_progress"] == 100
    assert s1["lessons_completed"] == 2
    assert s1["total_lessons"] == 2
    assert s1["quiz_attempts"] == 2
    assert s1["average_quiz_score"] == 90.0
    assert s1["completed"] is True
    assert s1["last_activity"] is not None
    s2 = by_student[student2.id]
    assert s2["course_progress"] == 50
    assert s2["lessons_completed"] == 1
    assert s2["quiz_attempts"] == 1
    assert s2["average_quiz_score"] == 60.0
    assert s2["completed"] is False

    # Recent activity
    activity = body["recent_activity"]
    types = [event["event_type"] for event in activity]
    assert "ENROLLED" in types
    assert "LESSON_STARTED" in types
    assert "LESSON_COMPLETED" in types
    assert "QUIZ_COMPLETED" in types
    assert "COURSE_COMPLETED" in types
    timestamps = [event["timestamp"] for event in activity]
    assert timestamps == sorted(timestamps, reverse=True)
    assert any(event["student_name"] == "Analytics S1" for event in activity)
    quiz_event = next(event for event in activity if event["event_type"] == "QUIZ_COMPLETED")
    assert "Lesson 1 Quiz" in quiz_event["description"]


def test_instructor_analytics_only_authorized_course_data(
    inst_a: User, inst_b: User
) -> None:
    student1 = _seed_student("Only Course A Student")
    student3 = _seed_student("Course B Student")

    course_a, lessons_a = _build_course(inst_a, "Isolation Course A", ["I1"])
    _enroll(student1, course_a)
    _complete_lesson(student1, lessons_a[0])

    course_b, lessons_b = _build_course(inst_b, "Isolation Course B", ["J1"])
    _enroll(student3, course_b)
    _complete_lesson(student3, lessons_b[0])

    a_headers = _auth_header(inst_a)
    a_list = client.get(f"{BASE}/analytics/instructor", headers=a_headers).json()
    a_course_ids = [item["course_id"] for item in a_list]
    assert course_a in a_course_ids
    assert course_b not in a_course_ids

    a_detail = client.get(
        f"{BASE}/analytics/instructor/courses/{course_a}", headers=a_headers
    ).json()
    student_names = [item["student_name"] for item in a_detail["student_performance"]]
    assert student_names == ["Only Course A Student"]
    assert "Course B Student" not in student_names
    assert "Isolation Course B" not in str(a_detail["recent_activity"])

    b_list = client.get(f"{BASE}/analytics/instructor", headers=_auth_header(inst_b)).json()
    b_course_ids = [item["course_id"] for item in b_list]
    assert course_b in b_course_ids
    assert course_a not in b_course_ids
    b_course = next(item for item in b_list if item["course_id"] == course_b)
    assert b_course["total_enrolled"] == 1
    assert b_course["completed_students"] == 1


def test_instructor_analytics_empty_course(inst_a: User) -> None:
    course_id, _ = _build_course(inst_a, "Empty Analytics Course", ["E1"], publish=False)

    response = client.get(
        f"{BASE}/analytics/instructor/courses/{course_id}", headers=_auth_header(inst_a)
    )
    assert response.status_code == 200
    body = response.json()
    assert body["summary"]["total_enrolled"] == 0
    assert body["summary"]["average_progress"] == 0.0
    assert body["summary"]["completion_rate"] == 0.0
    assert body["progress"]["min_progress"] == 0
    assert body["progress"]["max_progress"] == 0
    assert len(body["lesson_analytics"]) == 1
    assert body["lesson_analytics"][0]["completion_percentage"] == 0.0
    assert body["student_performance"] == []
    assert body["quiz_analytics"] == []
    assert body["recent_activity"] == []


def test_instructor_analytics_includes_unpublished_courses_in_list(
    inst_a: User,
) -> None:
    course_id, _ = _build_course(inst_a, "Unpublished Listed Course", ["U1"], publish=False)
    listing = client.get(f"{BASE}/analytics/instructor", headers=_auth_header(inst_a)).json()
    match = [item for item in listing if item["course_id"] == course_id]
    assert len(match) == 1
    assert match[0]["published"] is False


def test_instructor_analytics_activity_is_limited(inst_a: User) -> None:
    student = _seed_student("Activity Limit Student")
    course_id, lessons = _build_course(inst_a, "Activity Limit Course", ["Z1", "Z2"])
    _enroll(student, course_id)
    _complete_lesson(student, lessons[0])
    _complete_lesson(student, lessons[1])

    body = client.get(
        f"{BASE}/analytics/instructor/courses/{course_id}", headers=_auth_header(inst_a)
    ).json()
    # 1 ENROLLED + 1 COURSE_COMPLETED + 2 LESSON_STARTED + 2 LESSON_COMPLETED = 6 events
    assert len(body["recent_activity"]) == 6
    types = sorted(event["event_type"] for event in body["recent_activity"])
    assert types == [
        "COURSE_COMPLETED",
        "ENROLLED",
        "LESSON_COMPLETED",
        "LESSON_COMPLETED",
        "LESSON_STARTED",
        "LESSON_STARTED",
    ]