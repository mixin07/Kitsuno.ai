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


def _seed_student(name: str = "Analytics Student") -> User:
    db = SessionLocal()
    try:
        user = User(
            name=name,
            email=f"analytics_{uuid.uuid4().hex[:8]}@test.com",
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
    payload = {"title": "Analytics Course", **overrides}
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
    inst: User,
    course_title: str,
    lesson_titles: list[str],
) -> tuple[int, list[int]]:
    course = _create_course(inst, title=course_title)
    module = _create_module(inst, course["id"], title=f"{course_title} Module")
    lesson_ids: list[int] = []
    for order, title in enumerate(lesson_titles, start=1):
        lesson = _create_lesson(inst, course["id"], module["id"], order, title)
        lesson_ids.append(lesson["id"])
    publish = client.post(
        f"{BASE}/courses/{course['id']}/publish", headers=_auth_header(inst)
    )
    assert publish.status_code == 200, publish.text
    return course["id"], lesson_ids


def _enroll(student: User, course_id: int) -> dict:
    response = client.post(
        f"{BASE}/enrollments/{course_id}", headers=_auth_header(student)
    )
    assert response.status_code == 201, response.text
    return response.json()


def _complete_lesson(student: User, lesson_id: int) -> None:
    response = client.put(
        f"{BASE}/progress/lessons/{lesson_id}",
        json={"completed": True},
        headers=_auth_header(student),
    )
    assert response.status_code == 200, response.text


def _seed_quiz(lesson_id: int, title: str = "Lesson Quiz") -> dict:
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


def _seed_attempt(student_id: int, quiz_id: int, percentage: float, completed_at: datetime) -> None:
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
# Access control
# --------------------------------------------------------------------------


def test_analytics_requires_authentication() -> None:
    assert client.get(f"{BASE}/analytics/student").status_code == 401


def test_instructor_forbidden_for_analytics(inst_a: User) -> None:
    assert client.get(f"{BASE}/analytics/student", headers=_auth_header(inst_a)).status_code == 403


def test_admin_forbidden_for_analytics(admin: User) -> None:
    assert client.get(f"{BASE}/analytics/student", headers=_auth_header(admin)).status_code == 403


# --------------------------------------------------------------------------
# Empty student
# --------------------------------------------------------------------------


def test_analytics_empty_student() -> None:
    student = _seed_student("Empty Analytics Student")
    response = client.get(f"{BASE}/analytics/student", headers=_auth_header(student))
    assert response.status_code == 200
    body = response.json()
    summary = body["summary"]
    assert summary["total_courses"] == 0
    assert summary["completed_courses"] == 0
    assert summary["active_courses"] == 0
    assert summary["overall_progress"] == 0
    assert summary["lessons_completed"] == 0
    assert summary["lessons_started"] == 0
    assert summary["quiz_attempts"] == 0
    assert summary["average_quiz_score"] == 0.0
    assert summary["best_quiz_score"] == 0.0
    assert body["courses"] == []
    assert body["quiz_performance"] == []
    assert body["recent_activity"] == []


# --------------------------------------------------------------------------
# Course counts and completion
# --------------------------------------------------------------------------


def test_analytics_course_counts_and_completion(inst_a: User) -> None:
    student = _seed_student("Analytics Counts Student")

    # Course A: complete all 2 lessons -> completed
    cid_a, lessons_a = _build_course(inst_a, "Complete Course", ["A1", "A2"])
    _enroll(student, cid_a)
    _complete_lesson(student, lessons_a[0])
    _complete_lesson(student, lessons_a[1])

    # Course B: complete 1 of 3 -> active
    cid_b, lessons_b = _build_course(inst_a, "Partial Course", ["B1", "B2", "B3"])
    _enroll(student, cid_b)
    _complete_lesson(student, lessons_b[0])

    # Course C: no progress -> active
    cid_c, _ = _build_course(inst_a, "Empty Course", ["C1"])
    _enroll(student, cid_c)

    response = client.get(f"{BASE}/analytics/student", headers=_auth_header(student))
    assert response.status_code == 200
    summary = response.json()["summary"]
    assert summary["total_courses"] == 3
    assert summary["completed_courses"] == 1
    assert summary["active_courses"] == 2
    assert summary["lessons_completed"] == 3
    assert summary["lessons_started"] == 3


def test_analytics_empty_course_does_not_count_completion(inst_a: User) -> None:
    student = _seed_student("Zero Lesson Course Student")

    # Course with no lessons: enrolled but nothing to complete
    cid, _ = _build_course(inst_a, "No Lessons Course", [])
    _enroll(student, cid)

    summary = client.get(
        f"{BASE}/analytics/student", headers=_auth_header(student)
    ).json()["summary"]
    assert summary["total_courses"] == 1
    assert summary["completed_courses"] == 0
    assert summary["active_courses"] == 1
    assert summary["overall_progress"] == 0
    assert summary["lessons_completed"] == 0
    assert summary["lessons_started"] == 0

    courses = client.get(
        f"{BASE}/analytics/student", headers=_auth_header(student)
    ).json()["courses"]
    assert courses[0]["total_lessons"] == 0
    assert courses[0]["completed_lessons"] == 0
    assert courses[0]["next_lesson_id"] is None


# --------------------------------------------------------------------------
# Lesson counts
# --------------------------------------------------------------------------


def test_analytics_lesson_started_and_completed_counts(inst_a: User) -> None:
    student = _seed_student("Lesson Counts Student")
    cid, lessons = _build_course(inst_a, "Lessons Course", ["L1", "L2", "L3"])
    _enroll(student, cid)
    _complete_lesson(student, lessons[0])
    _complete_lesson(student, lessons[1])

    # Start L3 without completing
    client.put(
        f"{BASE}/progress/lessons/{lessons[2]}",
        json={"watch_time": 5.0},
        headers=_auth_header(student),
    )

    summary = client.get(
        f"{BASE}/analytics/student", headers=_auth_header(student)
    ).json()["summary"]
    assert summary["lessons_completed"] == 2
    assert summary["lessons_started"] == 3


# --------------------------------------------------------------------------
# Quiz scores
# --------------------------------------------------------------------------


def test_analytics_quiz_scores(inst_a: User) -> None:
    student = _seed_student("Quiz Scores Student")
    cid, lessons = _build_course(inst_a, "Quiz Score Course", ["Q1"])
    _enroll(student, cid)
    quiz = _seed_quiz(lessons[0], title="Score Quiz")

    now = datetime.now(timezone.utc)
    _seed_attempt(student.id, quiz["id"], percentage=80.0, completed_at=now)
    _seed_attempt(student.id, quiz["id"], percentage=100.0, completed_at=now)

    summary = client.get(
        f"{BASE}/analytics/student", headers=_auth_header(student)
    ).json()["summary"]
    assert summary["quiz_attempts"] == 2
    assert summary["average_quiz_score"] == 90.0
    assert summary["best_quiz_score"] == 100.0


def test_analytics_unfinished_attempt_not_counted(inst_a: User) -> None:
    student = _seed_student("Unfinished Attempt Student")
    cid, lessons = _build_course(inst_a, "Unfinished Course", ["U1"])
    _enroll(student, cid)
    quiz = _seed_quiz(lessons[0], title="In Progress Quiz")

    # Completed attempt
    _seed_attempt(student.id, quiz["id"], percentage=60.0, completed_at=datetime.now(timezone.utc))
    # In-progress attempt (no completed_at)
    db = SessionLocal()
    try:
        attempt = QuizAttempt(
            quiz_id=quiz["id"],
            student_id=student.id,
            score=0.0,
            total_points=0.0,
            percentage=0.0,
            completed_at=None,
        )
        db.add(attempt)
        db.commit()
    finally:
        db.close()

    summary = client.get(
        f"{BASE}/analytics/student", headers=_auth_header(student)
    ).json()["summary"]
    assert summary["quiz_attempts"] == 1
    assert summary["average_quiz_score"] == 60.0
    assert summary["best_quiz_score"] == 60.0


# --------------------------------------------------------------------------
# Course progress list
# --------------------------------------------------------------------------


def test_analytics_course_progress_list(inst_a: User) -> None:
    student = _seed_student("Progress List Student")
    cid, lessons = _build_course(inst_a, "Progress List", ["PL1", "PL2", "PL3"])
    _enroll(student, cid)
    _complete_lesson(student, lessons[0])

    courses = client.get(
        f"{BASE}/analytics/student", headers=_auth_header(student)
    ).json()["courses"]
    assert len(courses) == 1
    item = courses[0]
    assert item["course_id"] == cid
    assert item["title"] == "Progress List"
    assert item["total_lessons"] == 3
    assert item["completed_lessons"] == 1
    assert item["completed"] is False
    assert item["next_lesson_id"] == lessons[1]
    assert item["next_lesson_title"] == "PL2"


def test_analytics_completed_course_flags(inst_a: User) -> None:
    student = _seed_student("Completed Course Student")
    cid, lessons = _build_course(inst_a, "Wrapped Up Course", ["W1", "W2"])
    _enroll(student, cid)
    _complete_lesson(student, lessons[0])
    _complete_lesson(student, lessons[1])

    course = client.get(
        f"{BASE}/analytics/student", headers=_auth_header(student)
    ).json()["courses"][0]
    assert course["progress"] == 100
    assert course["completed"] is True
    assert course["next_lesson_id"] is None
    assert course["next_lesson_title"] is None


# --------------------------------------------------------------------------
# Quiz performance list
# --------------------------------------------------------------------------


def test_analytics_quiz_performance_list(inst_a: User) -> None:
    student = _seed_student("Quiz Performance Student")
    cid, lessons = _build_course(inst_a, "QP Course", ["QP1", "QP2"])
    _enroll(student, cid)
    quiz_a = _seed_quiz(lessons[0], title="Quiz A")
    quiz_b = _seed_quiz(lessons[1], title="Quiz B")

    now = datetime.now(timezone.utc)
    _seed_attempt(student.id, quiz_a["id"], percentage=70.0, completed_at=now)
    _seed_attempt(student.id, quiz_a["id"], percentage=90.0, completed_at=now)
    _seed_attempt(student.id, quiz_b["id"], percentage=50.0, completed_at=now)

    quiz_perf = client.get(
        f"{BASE}/analytics/student", headers=_auth_header(student)
    ).json()["quiz_performance"]
    assert len(quiz_perf) == 2
    by_quiz = {q["quiz_id"]: q for q in quiz_perf}

    assert by_quiz[quiz_a["id"]]["quiz_title"] == "Quiz A"
    assert by_quiz[quiz_a["id"]]["course_title"] == "QP Course"
    assert by_quiz[quiz_a["id"]]["attempts"] == 2
    assert by_quiz[quiz_a["id"]]["average_percentage"] == 80.0
    assert by_quiz[quiz_a["id"]]["best_percentage"] == 90.0

    assert by_quiz[quiz_b["id"]]["attempts"] == 1
    assert by_quiz[quiz_b["id"]]["average_percentage"] == 50.0
    assert by_quiz[quiz_b["id"]]["best_percentage"] == 50.0


# --------------------------------------------------------------------------
# Recent activity
# --------------------------------------------------------------------------


def test_analytics_recent_activity(inst_a: User) -> None:
    student = _seed_student("Activity Student")
    cid, lessons = _build_course(inst_a, "Activity Course", ["Act1", "Act2"])
    _enroll(student, cid)
    _complete_lesson(student, lessons[0])
    quiz = _seed_quiz(lessons[0], title="Activity Quiz")
    _seed_attempt(student.id, quiz["id"], percentage=75.0, completed_at=datetime.now(timezone.utc))

    activity = client.get(
        f"{BASE}/analytics/student", headers=_auth_header(student)
    ).json()["recent_activity"]
    types = [e["event_type"] for e in activity]
    assert "ENROLLED" in types
    assert "LESSON_STARTED" in types
    assert "LESSON_COMPLETED" in types
    assert "QUIZ_COMPLETED" in types

    # Verify sorted descending by timestamp, most recent event first
    timestamps = [e["timestamp"] for e in activity]
    assert timestamps == sorted(timestamps, reverse=True)

    quiz_event = next(e for e in activity if e["event_type"] == "QUIZ_COMPLETED")
    assert "Activity Quiz" in quiz_event["description"]
    assert "75%" in quiz_event["description"]


def test_analytics_course_completed_appears_in_activity(inst_a: User) -> None:
    student = _seed_student("Completed Activity Student")
    cid, lessons = _build_course(inst_a, "Complete Activity", ["CA1"])
    _enroll(student, cid)
    _complete_lesson(student, lessons[0])

    activity = client.get(
        f"{BASE}/analytics/student", headers=_auth_header(student)
    ).json()["recent_activity"]
    types = [e["event_type"] for e in activity]
    assert "COURSE_COMPLETED" in types


# --------------------------------------------------------------------------
# Cross-student isolation
# --------------------------------------------------------------------------


def test_analytics_cross_student_isolation(inst_a: User) -> None:
    student_x = _seed_student("Analytics X")
    student_y = _seed_student("Analytics Y")

    # Student X: 2 courses, some progress
    cid_x1, lessons_x1 = _build_course(inst_a, "X Course 1", ["X1L1", "X1L2"])
    cid_x2, lessons_x2 = _build_course(inst_a, "X Course 2", ["X2L1"])
    _enroll(student_x, cid_x1)
    _complete_lesson(student_x, lessons_x1[0])
    _enroll(student_x, cid_x2)

    # Student Y: 1 different course
    cid_y, lessons_y = _build_course(inst_a, "Y Course", ["YL1"])
    _enroll(student_y, cid_y)
    _complete_lesson(student_y, lessons_y[0])

    # X's analytics only contain X's data
    body_x = client.get(
        f"{BASE}/analytics/student", headers=_auth_header(student_x)
    ).json()
    assert body_x["summary"]["total_courses"] == 2
    assert body_x["summary"]["lessons_completed"] == 1
    course_titles = {c["title"] for c in body_x["courses"]}
    assert course_titles == {"X Course 1", "X Course 2"}

    # Y's analytics only contain Y's data
    body_y = client.get(
        f"{BASE}/analytics/student", headers=_auth_header(student_y)
    ).json()
    assert body_y["summary"]["total_courses"] == 1
    assert body_y["summary"]["lessons_completed"] == 1
    assert body_y["courses"][0]["title"] == "Y Course"


# --------------------------------------------------------------------------
# Overall progress averaging and activity limit
# --------------------------------------------------------------------------


def test_analytics_overall_progress_average(inst_a: User) -> None:
    student = _seed_student("Overall Progress Student")
    # Course A: 100% complete
    cid_a, lessons_a = _build_course(inst_a, "Full Progress", ["FP1"])
    _enroll(student, cid_a)
    _complete_lesson(student, lessons_a[0])

    # Course B: 50% complete (2 lessons, 1 done)
    cid_b, lessons_b = _build_course(inst_a, "Half Progress", ["HP1", "HP2"])
    _enroll(student, cid_b)
    _complete_lesson(student, lessons_b[0])

    summary = client.get(
        f"{BASE}/analytics/student", headers=_auth_header(student)
    ).json()["summary"]
    # Overall = round((100 + 50) / 2) = 75
    assert summary["overall_progress"] == 75


def test_analytics_activity_limit_20(inst_a: User) -> None:
    heavy = _seed_student("Heavy Student")

    # Create 6 courses each with 2 lessons and enroll -> 6 ENROLLED events,
    # complete all 12 lessons -> 12 LESSON_STARTED + 12 LESSON_COMPLETED.
    # Total 30 events, should be truncated to 20.
    for i in range(6):
        cid, lessons = _build_course(inst_a, f"Limit Course {i}", [f"L{i}A", f"L{i}B"])
        _enroll(heavy, cid)
        _complete_lesson(heavy, lessons[0])
        _complete_lesson(heavy, lessons[1])

    activity = client.get(
        f"{BASE}/analytics/student", headers=_auth_header(heavy)
    ).json()["recent_activity"]
    assert len(activity) == 20
    timestamps = [e["timestamp"] for e in activity]
    assert timestamps == sorted(timestamps, reverse=True)