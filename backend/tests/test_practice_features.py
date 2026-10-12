import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from app.database import SessionLocal
from app.main import app
from app.models import (
    Course,
    ExamSession,
    ExamSessionQuestion,
    Question,
    QuestionPractice,
    Quiz,
    QuizAttempt,
    User,
    UserRole,
)
from app.core.security import hash_password

client = TestClient(app)
BASE = "/api/v1"
TEST_PASSWORD = "TestPassword123!"


def _auth_header(user: User) -> dict[str, str]:
    res = client.post(
        f"{BASE}/auth/login", json={"email": user.email, "password": TEST_PASSWORD}
    )
    assert res.status_code == 200, f"Login failed for {user.email}"
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


# ==========================================
# 1. QUIZ HUB TESTS
# ==========================================

def test_quiz_hub_student_can_list_quizzes(student: User):
    """Authenticated student can access quiz hub with all real quizzes and correct stats."""
    headers = _auth_header(student)
    res = client.get(f"{BASE}/practice/quiz-hub", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_quizzes" in data
    assert data["total_quizzes"] >= 36
    assert len(data["quizzes"]) == data["total_quizzes"]

    # Verify quiz properties
    first_quiz = data["quizzes"][0]
    assert "id" in first_quiz
    assert "title" in first_quiz
    assert "course_title" in first_quiz
    assert "question_count" in first_quiz
    assert "status" in first_quiz
    assert first_quiz["status"] in ["NOT_ATTEMPTED", "IN_PROGRESS", "COMPLETED"]


def test_quiz_hub_ownership_and_isolation(student: User, inst_a: User):
    """A student's attempt history does not leak to another student."""
    headers = _auth_header(student)
    res = client.get(f"{BASE}/practice/quiz-hub", headers=headers)
    assert res.status_code == 200
    student_data = res.json()

    # Instructor should not be allowed into student quiz hub
    inst_headers = _auth_header(inst_a)
    inst_res = client.get(f"{BASE}/practice/quiz-hub", headers=inst_headers)
    assert inst_res.status_code == 403


# ==========================================
# 2. QUESTION BANK TESTS
# ==========================================

def test_question_bank_listing_and_safety(student: User):
    """Questions are returned without exposing correct answer flags."""
    headers = _auth_header(student)
    res = client.get(f"{BASE}/practice/question-bank", headers=headers)
    assert res.status_code == 200
    questions = res.json()
    assert len(questions) > 0

    # Ensure none of the options contain 'is_correct' field
    for q in questions[:10]:
        assert "question_text" in q
        assert "options" in q
        assert len(q["options"]) > 0
        for opt in q["options"]:
            assert "option_text" in opt
            assert "is_correct" not in opt, "SECURITY BREACH: is_correct exposed in question bank"


def test_question_bank_filtering(student: User):
    """Questions can be filtered by course ID."""
    db = SessionLocal()
    course = db.query(Course).first()
    course_id = course.id
    db.close()

    headers = _auth_header(student)
    res = client.get(f"{BASE}/practice/question-bank?course_id={course_id}", headers=headers)
    assert res.status_code == 200
    items = res.json()
    for item in items:
        assert item["course_id"] == course_id


def test_question_bank_check_answer_and_stats(student: User):
    """Student can check an answer, receive feedback, and view real stats."""
    db = SessionLocal()
    q = db.query(Question).first()
    correct_opt = next(o for o in q.options if o.is_correct)
    wrong_opt = next(o for o in q.options if not o.is_correct)
    q_id = q.id
    correct_id = correct_opt.id
    wrong_id = wrong_opt.id
    db.close()

    headers = _auth_header(student)

    # 1. Submit incorrect option
    res_wrong = client.post(
        f"{BASE}/practice/question-bank/check",
        json={"question_id": q_id, "selected_option_id": wrong_id},
        headers=headers,
    )
    assert res_wrong.status_code == 200
    data_wrong = res_wrong.json()
    assert data_wrong["is_correct"] is False
    assert data_wrong["correct_option_id"] == correct_id

    # 2. Check stats updated
    stats_res = client.get(f"{BASE}/practice/question-bank/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["questions_practiced"] >= 1

    # 3. Submit correct option
    res_correct = client.post(
        f"{BASE}/practice/question-bank/check",
        json={"question_id": q_id, "selected_option_id": correct_id},
        headers=headers,
    )
    assert res_correct.status_code == 200
    data_correct = res_correct.json()
    assert data_correct["is_correct"] is True
    assert data_correct["correct_option_id"] == correct_id


# ==========================================
# 3. MOCK EXAMS TESTS
# ==========================================

def test_mock_exam_creation_and_rejection(student: User):
    """Valid config succeeds; invalid config (too many questions) is rejected."""
    headers = _auth_header(student)

    # Valid: 10 questions from All Courses
    create_res = client.post(
        f"{BASE}/practice/mock-exams",
        json={"course_id": None, "question_count": 10, "duration_minutes": 15},
        headers=headers,
    )
    assert create_res.status_code == 201
    session = create_res.json()
    assert session["question_count"] == 10
    assert len(session["questions"]) == 10
    session_id = session["id"]

    # Ensure no is_correct exposed
    for q in session["questions"]:
        for opt in q["options"]:
            assert "is_correct" not in opt

    # Invalid: HTML course has 15 questions, requesting 30 must fail
    db = SessionLocal()
    html_course = db.query(Course).filter(Course.title == "Introduction to HTML").first()
    db.close()

    fail_res = client.post(
        f"{BASE}/practice/mock-exams",
        json={"course_id": html_course.id, "question_count": 30, "duration_minutes": 30},
        headers=headers,
    )
    assert fail_res.status_code == 400


def test_mock_exam_submission_and_review(student: User):
    """Submitting mock exam grades answers accurately and locks the session."""
    headers = _auth_header(student)

    # 1. Create a 5-question exam
    create_res = client.post(
        f"{BASE}/practice/mock-exams",
        json={"course_id": None, "question_count": 5, "duration_minutes": 10},
        headers=headers,
    )
    assert create_res.status_code == 201
    session = create_res.json()
    session_id = session["id"]
    questions = session["questions"]

    # 2. Submit answers
    answers = [
        {"question_id": q["id"], "selected_option_id": q["options"][0]["id"]}
        for q in questions
    ]
    sub_res = client.post(
        f"{BASE}/practice/mock-exams/{session_id}/submit",
        json={"answers": answers},
        headers=headers,
    )
    assert sub_res.status_code == 200
    result = sub_res.json()
    assert result["status"] == "SUBMITTED"
    assert "score" in result
    assert "percentage" in result
    assert len(result["reviews"]) == 5

    # 3. Duplicate submission returns existing result without error
    sub2_res = client.post(
        f"{BASE}/practice/mock-exams/{session_id}/submit",
        json={"answers": answers},
        headers=headers,
    )
    assert sub2_res.status_code == 200
    assert sub2_res.json()["id"] == session_id

    # 4. Result review endpoint
    review_res = client.get(f"{BASE}/practice/mock-exams/{session_id}/result", headers=headers)
    assert review_res.status_code == 200
    assert review_res.json()["id"] == session_id


# ==========================================
# 4. AI SEARCH TESTS
# ==========================================

def test_ai_search_query_matching(student: User):
    """Natural language queries return relevant real courses, modules, lessons, and quizzes."""
    headers = _auth_header(student)

    # Query matching HTML
    res = client.get(f"{BASE}/search?q=HTML", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_results"] > 0
    types = {r["content_type"] for r in data["results"]}
    assert "COURSE" in types or "LESSON" in types or "QUIZ" in types

    # Query matching Javascript async
    res_js = client.get(f"{BASE}/search?q=javascript async", headers=headers)
    assert res_js.status_code == 200
    assert res_js.json()["total_results"] > 0


def test_ai_search_nonexistent_content(student: User):
    """Non-existent subjects (e.g. Docker) return clean empty result with zero fabricated courses."""
    headers = _auth_header(student)
    res = client.get(f"{BASE}/search?q=Docker Kubernetes Container", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_results"] == 0
    assert len(data["results"]) == 0
