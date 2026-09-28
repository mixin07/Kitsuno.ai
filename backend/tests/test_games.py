from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.jwt import create_access_token
from app.database import SessionLocal
from app.main import app
from app.models import Course, Enrollment, Lesson, LessonProgress, Module, User, UserRole
from app.models.gamification import GameAttempt

client = TestClient(app)


def _auth_header(user: User) -> dict[str, str]:
    token = create_access_token(subject=str(user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def course_with_enrollment(student: User, inst_a: User) -> tuple[int, str]:
    db = SessionLocal()
    try:
        course = Course(
            title="HTML Basics for Games",
            description="Testing course for game context",
            instructor_id=inst_a.id,
            published=True,
        )
        db.add(course)
        db.commit()
        db.refresh(course)

        module = Module(course_id=course.id, title="Module 1", order_number=1)
        db.add(module)
        db.commit()
        db.refresh(module)

        lesson = Lesson(module_id=module.id, title="Lesson 1", content="Content", order_number=1)
        db.add(lesson)
        db.commit()
        db.refresh(lesson)

        enrollment = Enrollment(student_id=student.id, course_id=course.id)
        db.add(enrollment)
        db.commit()

        return course.id, course.title
    finally:
        db.close()


@pytest.fixture
def unenrolled_course_id(inst_a: User) -> int:
    db = SessionLocal()
    try:
        course = Course(
            title="Unenrolled Course",
            description="Course student is not in",
            instructor_id=inst_a.id,
            published=True,
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        return course.id
    finally:
        db.close()


def test_list_games(student: User):
    response = client.get("/api/v1/games", headers=_auth_header(student))
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 5
    game_ids = [g["id"] for g in data]
    assert "quiz-rush" in game_ids
    assert "memory-match" in game_ids
    assert "code-challenge" in game_ids
    assert "word-scramble" in game_ids
    assert "speed-recall" in game_ids


def test_get_game_details_and_tokens(student: User):
    for gid in ["quiz-rush", "memory-match", "code-challenge", "word-scramble", "speed-recall", "speed-quiz"]:
        res = client.get(f"/api/v1/games/{gid}", headers=_auth_header(student))
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == gid
        assert "session_token" in data
        assert data["session_token"].startswith("game_sess_")
        assert "content" in data


def test_start_game_with_enrollment_check(student: User, course_with_enrollment: tuple[int, str], unenrolled_course_id: int):
    headers = _auth_header(student)
    c_id, c_title = course_with_enrollment

    # 1. Start with enrolled course: should succeed
    res = client.post(
        "/api/v1/games/quiz-rush/start",
        json={"course_id": c_id},
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["course_id"] == c_id
    assert data["course_title"] == c_title
    assert data["session_token"].startswith("game_sess_")

    # 2. Start with unenrolled course: should return 403 Forbidden
    res_fail = client.post(
        "/api/v1/games/quiz-rush/start",
        json={"course_id": unenrolled_course_id},
        headers=headers,
    )
    assert res_fail.status_code == 403
    assert "Enroll" in res_fail.json()["detail"]


def test_server_side_scoring_and_tamper_proofing(student: User):
    headers = _auth_header(student)

    # Start session
    start_res = client.post("/api/v1/games/quiz-rush/start", json={}, headers=headers)
    assert start_res.status_code == 200
    session_token = start_res.json()["session_token"]

    # Student attempts to forge score = 9999, but provides 2 valid answers
    # qr_html_1 correct_index is 0 (<header>)
    # qr_html_2 correct_index is 1 (Provides accessible text alternative)
    answers = [
        {"question_id": "qr_html_1", "selected_index": 0},
        {"question_id": "qr_html_2", "selected_index": 1},
        {"question_id": "qr_html_3", "selected_index": 3},  # incorrect
    ]

    complete_res = client.post(
        "/api/v1/games/quiz-rush/complete",
        json={
            "session_token": session_token,
            "score": 9999,  # Attempted tamper!
            "time_spent_seconds": 20,
            "answers": answers,
        },
        headers=headers,
    )
    assert complete_res.status_code == 200
    data = complete_res.json()
    assert data["success"] is True
    # Server calculated score is authoritative (2 correct * 100 + time bonus), definitely NOT 9999!
    assert data["score"] < 1000
    assert data["score"] != 9999
    assert data["questions_count"] == 3
    assert data["correct_count"] == 2
    assert round(data["accuracy"], 1) == 66.7


def test_complete_game_awards_xp_and_is_idempotent(student: User):
    headers = _auth_header(student)

    # 1. Start game session
    res = client.post("/api/v1/games/speed-recall/start", json={}, headers=headers)
    assert res.status_code == 200
    token = res.json()["session_token"]

    # 2. Check initial gamification state
    status_res = client.get("/api/v1/gamification/me", headers=headers)
    assert status_res.status_code == 200
    initial_xp = status_res.json()["total_xp"]

    # 3. Submit completion
    complete_res = client.post(
        "/api/v1/games/speed-recall/complete",
        json={"score": 850, "time_spent_seconds": 45, "session_token": token},
        headers=headers,
    )
    assert complete_res.status_code == 200
    result_data = complete_res.json()
    assert result_data["success"] is True
    assert result_data["xp_awarded"] > 0
    assert result_data["total_xp"] == initial_xp + result_data["xp_awarded"]
    first_xp_awarded = result_data["xp_awarded"]

    # 4. Submit duplicate completion with the SAME session token (Idempotency test)
    dup_res = client.post(
        "/api/v1/games/speed-recall/complete",
        json={"score": 850, "time_spent_seconds": 45, "session_token": token},
        headers=headers,
    )
    assert dup_res.status_code == 200
    dup_data = dup_res.json()
    assert dup_data["success"] is True
    assert dup_data["xp_awarded"] == 0  # Idempotent: 0 additional XP
    assert dup_data["total_xp"] == initial_xp + first_xp_awarded  # Total XP unchanged!


def test_game_stats_and_history_endpoints(student: User):
    headers = _auth_header(student)

    # Fetch stats
    stats_res = client.get("/api/v1/games/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "games_played" in stats
    assert "best_score" in stats
    assert "total_game_xp" in stats
    assert "plays_by_game" in stats
    assert stats["games_played"] >= 1

    # Fetch history
    history_res = client.get("/api/v1/games/history?limit=10", headers=headers)
    assert history_res.status_code == 200
    history = history_res.json()
    assert isinstance(history, list)
    assert len(history) >= 1
    recent = history[0]
    assert "game_id" in recent
    assert "game_title" in recent
    assert "score" in recent
    assert "accuracy" in recent
    assert "xp_awarded" in recent


def test_game_completion_does_not_corrupt_course_progress(student: User):
    db = SessionLocal()
    try:
        lp_count_before = db.query(LessonProgress).filter(LessonProgress.student_id == student.id).count()
    finally:
        db.close()

    headers = _auth_header(student)
    res = client.post("/api/v1/games/code-challenge/start", json={}, headers=headers)
    token = res.json()["session_token"]

    post_res = client.post(
        "/api/v1/games/code-challenge/complete",
        json={"score": 500, "time_spent_seconds": 90, "session_token": token},
        headers=headers,
    )
    assert post_res.status_code == 200

    db = SessionLocal()
    try:
        lp_count_after = db.query(LessonProgress).filter(LessonProgress.student_id == student.id).count()
        assert lp_count_before == lp_count_after
    finally:
        db.close()
