import pytest
from datetime import date, datetime, timezone
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models import Course, Enrollment, Lesson, LessonProgress, Module, User, UserGamification, UserRole
from app.models.notification import Notification
from app.services.gamification_service import award_xp, record_activity_and_streak
from tests.conftest import TEST_PASSWORD, _create_db_user

client = TestClient(app)
BASE = "/api/v1"


def _get_auth_headers(user: User) -> dict[str, str]:
    res = client.post(
        f"{BASE}/auth/login", json={"email": user.email, "password": TEST_PASSWORD}
    )
    assert res.status_code == 200, f"Login failed: {res.text}"
    return {"Authorization": f"Bearer {res.json()['access_token']}"}




def test_streak_details_empty_and_active():
    db = SessionLocal()
    user = _create_db_user("StreakStudent", UserRole.STUDENT)
    client = TestClient(app)
    headers = _get_auth_headers(user)

    try:
        # Initially 0 streak
        res = client.get("/api/v1/gamification/streak", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["current_streak"] == 0
        assert data["longest_streak"] == 0
        assert data["is_active_today"] is False
        assert "start a streak" in data["today_status_message"].lower() or "keep your streak" in data["today_status_message"].lower()
        assert isinstance(data["active_dates_past_14"], list)
        assert isinstance(data["recent_activities"], list)

        # Record activity today
        record_activity_and_streak(db, user.id, date.today())

        res2 = client.get("/api/v1/gamification/streak", headers=headers)
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["current_streak"] == 1
        assert data2["longest_streak"] == 1
        assert data2["is_active_today"] is True
        assert "streak active today" in data2["today_status_message"].lower()

    finally:
        db.close()


def test_xp_summary_and_log_history():
    db = SessionLocal()
    user = _create_db_user("XpStudent", UserRole.STUDENT)
    client = TestClient(app)
    headers = _get_auth_headers(user)

    try:
        # Initial XP summary
        res = client.get("/api/v1/gamification/xp-summary", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["total_xp"] == 0
        assert data["current_level"] == 1
        assert data["xp_earned_today"] == 0
        assert data["xp_earned_this_week"] == 0
        assert data["recent_history"] == []

        # Award XP for a real event
        award_xp(
            db=db,
            user_id=user.id,
            xp_amount=50,
            event_type="LESSON_COMPLETED",
            reference_key=f"lesson_xp_test:{user.id}:1",
            description="Completed Lesson #1",
        )

        res2 = client.get("/api/v1/gamification/xp-summary", headers=headers)
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["total_xp"] == 50
        assert data2["xp_earned_today"] == 50
        assert data2["xp_earned_this_week"] == 50
        assert len(data2["recent_history"]) == 1
        assert data2["recent_history"][0]["xp_earned"] == 50
        assert data2["recent_history"][0]["description"] == "Completed Lesson #1"

    finally:
        db.close()


def test_level_details_progression():
    db = SessionLocal()
    user = _create_db_user("LevelStudent", UserRole.STUDENT)
    client = TestClient(app)
    headers = _get_auth_headers(user)

    try:
        res = client.get("/api/v1/gamification/level-details", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["current_level"] == 1
        assert data["total_xp"] == 0
        assert data["next_level"] == 2
        assert len(data["levels_timeline"]) >= 6

        # Level 1 should be current & unlocked
        lvl1 = next(item for item in data["levels_timeline"] if item["level"] == 1)
        assert lvl1["is_current"] is True
        assert lvl1["is_unlocked"] is True
        assert lvl1["xp_threshold"] == 0

        # Level 2 should be locked
        lvl2 = next(item for item in data["levels_timeline"] if item["level"] == 2)
        assert lvl2["is_current"] is False
        assert lvl2["is_unlocked"] is False
        assert lvl2["xp_threshold"] == 100

    finally:
        db.close()


def test_notifications_empty_state_and_read_actions():
    db = SessionLocal()
    user = _create_db_user("NotifStudent", UserRole.STUDENT)
    client = TestClient(app)
    headers = _get_auth_headers(user)

    try:
        # 1. Empty state
        res = client.get("/api/v1/notifications", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["unread_count"] == 0
        assert data["items"] == []

        # 2. Add real notification manually
        notif = Notification(
            user_id=user.id,
            category="LESSON",
            reference_key=f"test_notif:{user.id}:1",
            title="Lesson Completed",
            message="You completed Introduction to HTML",
            link_url="/courses/1/lessons/1",
            is_read=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)

        res2 = client.get("/api/v1/notifications", headers=headers)
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["unread_count"] == 1
        assert len(data2["items"]) == 1
        assert data2["items"][0]["title"] == "Lesson Completed"
        assert data2["items"][0]["is_read"] is False

        # 3. Mark single as read
        read_res = client.post(f"/api/v1/notifications/{notif.id}/read", headers=headers)
        assert read_res.status_code == 200
        assert read_res.json()["success"] is True

        res3 = client.get("/api/v1/notifications", headers=headers)
        assert res3.json()["unread_count"] == 0
        assert res3.json()["items"][0]["is_read"] is True

        # 4. Mark all as read
        read_all_res = client.post("/api/v1/notifications/read-all", headers=headers)
        assert read_all_res.status_code == 200

    finally:
        db.close()


def test_data_ownership_security():
    db = SessionLocal()
    student_a = _create_db_user("StudentA", UserRole.STUDENT)
    student_b = _create_db_user("StudentB", UserRole.STUDENT)
    client = TestClient(app)
    headers_a = _get_auth_headers(student_a)
    headers_b = _get_auth_headers(student_b)

    try:
        # Create notification for student_a
        notif_a = Notification(
            user_id=student_a.id,
            category="QUIZ",
            reference_key=f"test_ownership:{student_a.id}",
            title="Quiz Finished",
            message="Great score!",
            link_url=None,
            is_read=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(notif_a)
        db.commit()
        db.refresh(notif_a)

        # Student B should NOT see student A's notification
        res_b = client.get("/api/v1/notifications", headers=headers_b)
        assert res_b.status_code == 200
        assert res_b.json()["unread_count"] == 0
        assert res_b.json()["items"] == []

        # Student B cannot mark student A's notification as read
        mark_res = client.post(f"/api/v1/notifications/{notif_a.id}/read", headers=headers_b)
        assert mark_res.status_code == 404

    finally:
        db.close()


def test_monthly_activity_endpoint():
    db = SessionLocal()
    user = _create_db_user("MonthlyActivityStudent", UserRole.STUDENT)
    client = TestClient(app)
    headers = _get_auth_headers(user)

    try:
        today = date.today()
        # Query monthly activity for current month
        res = client.get(f"/api/v1/gamification/monthly-activity?year={today.year}&month={today.month}", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["year"] == today.year
        assert data["month"] == today.month
        assert isinstance(data["active_dates"], list)
        assert isinstance(data["days"], dict)

        # Record activity today
        record_activity_and_streak(db, user.id, today)
        award_xp(db, user.id, 50, "LESSON_COMPLETED", f"test_lesson:{user.id}", "Completed intro lesson")

        res2 = client.get(f"/api/v1/gamification/monthly-activity?year={today.year}&month={today.month}", headers=headers)
        assert res2.status_code == 200
        data2 = res2.json()
        today_str = today.strftime("%Y-%m-%d")
        assert today_str in data2["active_dates"]
        assert today_str in data2["days"]
        today_summary = data2["days"][today_str]
        assert today_summary["activity_count"] >= 1
        assert today_summary["xp_earned"] == 50

    finally:
        db.close()
