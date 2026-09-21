import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy import case, func, select

from app.core.security import hash_password
from app.database import SessionLocal
from app.main import app
from app.models import (
    Course,
    Enrollment,
    Lesson,
    LessonProgress,
    Module,
    Option,
    Question,
    Quiz,
    QuizAttempt,
    User,
    UserRole,
)

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
            email=f"admin_analytics_{uuid.uuid4().hex[:8]}@test.com",
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
    payload = {"title": "Admin Analytics Course", **overrides}
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
        response = client.post(f"{BASE}/courses/{course['id']}/publish", headers=_auth_header(inst))
        assert response.status_code == 200, response.text
    return course["id"], lesson_ids


def _enroll(student: User, course_id: int) -> None:
    response = client.post(f"{BASE}/enrollments/{course_id}", headers=_auth_header(student))
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
        question = Question(quiz_id=quiz.id, question_text="Test?", points=1, order_index=1)
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


def _snapshot_platform() -> dict:
    db = SessionLocal()
    try:
        role_counts = dict(
            db.execute(select(User.role, func.count()).group_by(User.role)).all()
        )
        total_courses, published_courses = db.execute(
            select(
                func.count(),
                func.sum(case((Course.published.is_(True), 1), else_=0)),
            ).select_from(Course)
        ).one()
        total_enrollments, completed_enrollments, sum_progress = db.execute(
            select(
                func.count(),
                func.sum(case((Enrollment.completed_at.is_not(None), 1), else_=0)),
                func.coalesce(func.sum(Enrollment.progress), 0),
            ).select_from(Enrollment)
        ).one()
        total_lessons = db.execute(select(func.count()).select_from(Lesson)).scalar_one()
        completed_lessons = db.execute(
            select(func.count()).where(LessonProgress.completed.is_(True)).select_from(LessonProgress)
        ).scalar_one()
        total_quizzes = db.execute(select(func.count()).select_from(Quiz)).scalar_one()
        total_attempts = db.execute(select(func.count()).select_from(QuizAttempt)).scalar_one()
        completed_attempts, sum_scores = db.execute(
            select(
                func.count(),
                func.coalesce(func.sum(QuizAttempt.percentage), 0),
            ).where(QuizAttempt.completed_at.is_not(None))
        ).one()

        enrollment_progress = db.execute(select(Enrollment.progress)).scalars().all()
        buckets = {"0-25%": 0, "26-50%": 0, "51-75%": 0, "76-100%": 0}
        for progress in enrollment_progress:
            if progress <= 25:
                buckets["0-25%"] += 1
            elif progress <= 50:
                buckets["26-50%"] += 1
            elif progress <= 75:
                buckets["51-75%"] += 1
            else:
                buckets["76-100%"] += 1

        return {
            "role_counts": role_counts,
            "total_users": sum(role_counts.values()),
            "total_courses": total_courses,
            "published_courses": published_courses or 0,
            "total_enrollments": total_enrollments,
            "completed_enrollments": completed_enrollments or 0,
            "sum_progress": sum_progress,
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "total_quizzes": total_quizzes,
            "total_attempts": total_attempts,
            "completed_attempts": completed_attempts,
            "sum_scores": sum_scores,
            "buckets": buckets,
        }
    finally:
        db.close()


def _rounded(value: float, digits: int) -> float:
    return round(value, digits)


def _expected_summary(baseline: dict, deltas: dict) -> dict:
    total_enrollments = baseline["total_enrollments"] + deltas.get("enrollments", 0)
    completed_attempts = baseline["completed_attempts"] + deltas.get("completed_attempts", 0)
    return {
        "total_users": baseline["total_users"] + deltas.get("users", 0),
        "total_students": baseline["role_counts"].get(UserRole.STUDENT, 0)
        + deltas.get("students", 0),
        "total_instructors": baseline["role_counts"].get(UserRole.INSTRUCTOR, 0)
        + deltas.get("instructors", 0),
        "total_admins": baseline["role_counts"].get(UserRole.ADMIN, 0)
        + deltas.get("admins", 0),
        "total_courses": baseline["total_courses"] + deltas.get("courses", 0),
        "published_courses": baseline["published_courses"] + deltas.get("published_courses", 0),
        "unpublished_courses": (baseline["total_courses"] - baseline["published_courses"])
        + deltas.get("unpublished_courses", 0),
        "total_enrollments": total_enrollments,
        "completed_enrollments": baseline["completed_enrollments"]
        + deltas.get("completed_enrollments", 0),
        "overall_course_progress": _rounded(
            (baseline["sum_progress"] + deltas.get("sum_progress", 0)) / total_enrollments, 1
        )
        if total_enrollments
        else 0.0,
        "total_lessons": baseline["total_lessons"] + deltas.get("lessons", 0),
        "completed_lessons": baseline["completed_lessons"] + deltas.get("completed_lessons", 0),
        "total_quizzes": baseline["total_quizzes"] + deltas.get("quizzes", 0),
        "total_quiz_attempts": baseline["total_attempts"] + deltas.get("attempts", 0),
        "completed_quiz_attempts": completed_attempts,
        "average_quiz_score": _rounded(
            (baseline["sum_scores"] + deltas.get("sum_scores", 0)) / completed_attempts, 2
        )
        if completed_attempts
        else 0.0,
    }


# --------------------------------------------------------------------------
# Security / RBAC
# --------------------------------------------------------------------------


def test_admin_analytics_requires_authentication():
    assert client.get(f"{BASE}/analytics/admin").status_code == 401


def test_student_cannot_access_admin_analytics(student: User):
    response = client.get(f"{BASE}/analytics/admin", headers=_auth_header(student))
    assert response.status_code == 403


def test_instructor_cannot_access_admin_analytics(inst_a: User):
    response = client.get(f"{BASE}/analytics/admin", headers=_auth_header(inst_a))
    assert response.status_code == 403


def test_admin_can_access_admin_analytics(admin: User):
    response = client.get(f"{BASE}/analytics/admin", headers=_auth_header(admin))
    assert response.status_code == 200
    body = response.json()
    for section in ("summary", "courses", "role_distribution", "progress_distribution", "recent_activity"):
        assert section in body
    roles = [item["role"] for item in body["role_distribution"]]
    assert roles == ["STUDENT", "INSTRUCTOR", "ADMIN"]
    buckets = [item["bucket"] for item in body["progress_distribution"]]
    assert buckets == ["0-25%", "26-50%", "51-75%", "76-100%"]


def test_admin_analytics_shape_stays_consistent_with_no_data(admin: User):
    response = client.get(f"{BASE}/analytics/admin", headers=_auth_header(admin))
    assert response.status_code == 200
    summary = response.json()["summary"]
    assert summary["total_users"] == (
        summary["total_students"] + summary["total_instructors"] + summary["total_admins"]
    )
    assert summary["total_courses"] == (
        summary["published_courses"] + summary["unpublished_courses"]
    )
    assert len(response.json()["role_distribution"]) == 3
    assert len(response.json()["progress_distribution"]) == 4


# --------------------------------------------------------------------------
# Data verification
# --------------------------------------------------------------------------


def test_admin_analytics_platform_wide_data(inst_a: User, inst_b: User, admin: User):
    baseline = _snapshot_platform()

    student1 = _seed_student("Admin S1")
    student2 = _seed_student("Admin S2")

    course_a, lessons_a = _build_course(inst_a, "Admin Analytics Course A", ["Admin L1", "Admin L2"])
    course_b, lessons_b = _build_course(
        inst_b, "Admin Analytics Course B", ["Admin BL1"], publish=False
    )
    quiz = _seed_quiz(lessons_a[0], title="Admin L1 Quiz")

    _enroll(student1, course_a)
    _enroll(student2, course_a)
    _complete_lesson(student1, lessons_a[0])
    _complete_lesson(student1, lessons_a[1])
    _complete_lesson(student2, lessons_a[0])

    now = datetime.now(timezone.utc)
    _seed_attempt(student1.id, quiz["id"], percentage=100.0, completed_at=now)
    _seed_attempt(student2.id, quiz["id"], percentage=50.0, completed_at=now)
    _seed_attempt(student2.id, quiz["id"], percentage=0.0, completed_at=now)

    response = client.get(f"{BASE}/analytics/admin", headers=_auth_header(admin))
    assert response.status_code == 200
    body = response.json()

    # Platform summary
    expected = _expected_summary(
        baseline,
        {
            "users": 2,
            "students": 2,
            "enrollments": 2,
            "completed_enrollments": 1,
            "sum_progress": 150,  # 100 (s1) + 50 (s2)
            "courses": 2,
            "published_courses": 1,
            "unpublished_courses": 1,
            "lessons": 3,
            "completed_lessons": 3,
            "quizzes": 1,
            "attempts": 3,
            "completed_attempts": 3,
            "sum_scores": 150.0,  # 100 + 50 + 0
        },
    )
    summary = body["summary"]
    for key, value in expected.items():
        assert summary[key] == value, f"summary.{key}: expected {value}, got {summary[key]}"
    assert summary["total_quiz_attempts"] == baseline["total_attempts"] + 3
    assert summary["completed_quiz_attempts"] == baseline["completed_attempts"] + 3

    # Role distribution
    role_counts = {item["role"]: item["count"] for item in body["role_distribution"]}
    assert role_counts["STUDENT"] == baseline["role_counts"].get(UserRole.STUDENT, 0) + 2
    assert role_counts["INSTRUCTOR"] == baseline["role_counts"].get(UserRole.INSTRUCTOR, 0)
    assert role_counts["ADMIN"] == baseline["role_counts"].get(UserRole.ADMIN, 0)

    # Progress distribution
    buckets = {item["bucket"]: item["students"] for item in body["progress_distribution"]}
    assert buckets["26-50%"] == baseline["buckets"]["26-50%"] + 1
    assert buckets["76-100%"] == baseline["buckets"]["76-100%"] + 1
    assert buckets["0-25%"] == baseline["buckets"]["0-25%"]
    assert buckets["51-75%"] == baseline["buckets"]["51-75%"]

    # Courses across multiple instructors
    by_id = {item["course_id"]: item for item in body["courses"]}
    a = by_id[course_a]
    assert a["course_title"] == "Admin Analytics Course A"
    assert a["instructor_name"] == "Test Instructor A"
    assert a["published"] is True
    assert a["enrollment_count"] == 2
    assert a["completion_count"] == 1
    assert a["average_progress"] == 75.0
    assert a["lesson_count"] == 2
    assert a["quiz_count"] == 1
    assert a["quiz_attempts"] == 3
    assert a["average_quiz_score"] == 50.0

    b = by_id[course_b]
    assert b["course_title"] == "Admin Analytics Course B"
    assert b["instructor_name"] == "Test Instructor B"
    assert b["published"] is False
    assert b["enrollment_count"] == 0
    assert b["completion_count"] == 0
    assert b["average_progress"] == 0.0
    assert b["lesson_count"] == 1
    assert b["quiz_count"] == 0
    assert b["quiz_attempts"] == 0
    assert b["average_quiz_score"] == 0.0

    # Recent activity includes seeded events across both courses
    activity = body["recent_activity"]
    descriptions = [event["description"] for event in activity]
    timestamps = [event["timestamp"] for event in activity]
    assert timestamps == sorted(timestamps, reverse=True)
    for need in [
        "Admin S1 enrolled in Admin Analytics Course A",
        "Admin S1 completed Admin Analytics Course A",
        "Admin S1 completed lesson Admin L1",
        "Admin S1 completed lesson Admin L2",
        "Admin S2 completed lesson Admin L1",
        "Admin S1 completed quiz Admin L1 Quiz (100%)",
        "Admin S2 completed quiz Admin L1 Quiz (50%)",
        "Admin S2 completed quiz Admin L1 Quiz (0%)",
    ]:
        assert any(need in desc for desc in descriptions), f"missing event: {need}"
    types = {event["event_type"] for event in activity}
    assert {"ENROLLED", "COURSE_COMPLETED", "LESSON_STARTED", "LESSON_COMPLETED", "QUIZ_COMPLETED"}.issubset(types)


def test_admin_analytics_empty_course_is_zeroed(inst_a: User, admin: User):
    course_id, _ = _build_course(inst_a, "Admin Empty Course", ["Empty L1"], publish=False)

    response = client.get(f"{BASE}/analytics/admin", headers=_auth_header(admin))
    assert response.status_code == 200
    item = next(c for c in response.json()["courses"] if c["course_id"] == course_id)

    assert item["course_title"] == "Admin Empty Course"
    assert item["published"] is False
    assert item["enrollment_count"] == 0
    assert item["completion_count"] == 0
    assert item["average_progress"] == 0.0
    assert item["lesson_count"] == 1
    assert item["quiz_count"] == 0
    assert item["quiz_attempts"] == 0
    assert item["average_quiz_score"] == 0.0


def test_admin_analytics_ignores_client_supplied_ids(admin: User):
    headers = _auth_header(admin)
    plain = client.get(f"{BASE}/analytics/admin", headers=headers).json()
    spoofed = client.get(
        f"{BASE}/analytics/admin?user_id=999&instructor_id=123", headers=headers
    ).json()
    assert plain == spoofed


def test_admin_analytics_recent_activity_is_limited(inst_a: User, admin: User):
    student = _seed_student("Activity Student")
    course_id, lessons = _build_course(inst_a, "Admin Activity Course", ["Act L1"])
    quiz = _seed_quiz(lessons[0], title="Act Quiz")
    _enroll(student, course_id)

    now = datetime.now(timezone.utc)
    for index in range(60):
        _seed_attempt(student.id, quiz["id"], percentage=float(index % 100), completed_at=now)

    response = client.get(f"{BASE}/analytics/admin", headers=_auth_header(admin))
    assert response.status_code == 200
    assert len(response.json()["recent_activity"]) == 50


def test_admin_analytics_sees_multiple_instructors_courses(inst_a: User, inst_b: User, admin: User):
    course_a, _ = _build_course(inst_a, "Multi Instructor A", ["MA1"])
    course_b, _ = _build_course(inst_b, "Multi Instructor B", ["MB1"])

    response = client.get(f"{BASE}/analytics/admin", headers=_auth_header(admin))
    assert response.status_code == 200
    course_ids = [item["course_id"] for item in response.json()["courses"]]
    assert course_a in course_ids
    assert course_b in course_ids