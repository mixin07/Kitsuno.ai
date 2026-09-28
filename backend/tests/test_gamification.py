from datetime import date, datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.jwt import create_access_token
from app.database import SessionLocal
from app.main import app
from app.models import User, UserRole, Quiz, QuizAttempt, Course, Module, Lesson
from app.services import gamification_service

client = TestClient(app)


def _auth_header(user: User) -> dict[str, str]:
    token = create_access_token(subject=str(user.id))
    return {"Authorization": f"Bearer {token}"}


def test_level_formula_boundaries():
    info1 = gamification_service.calculate_level(0)
    assert info1.current_level == 1
    assert info1.xp_into_level == 0
    assert info1.xp_required_for_next_level == 100

    info2 = gamification_service.calculate_level(99)
    assert info2.current_level == 1
    assert info2.xp_into_level == 99

    info3 = gamification_service.calculate_level(100)
    assert info3.current_level == 2
    assert info3.xp_into_level == 0
    assert info3.xp_required_for_next_level == 200  # Level 3 threshold is 300 -> 300 - 100 = 200

    info4 = gamification_service.calculate_level(300)
    assert info4.current_level == 3
    assert info4.xp_into_level == 0

    info5 = gamification_service.calculate_level(1000)
    assert info5.current_level == 5


def test_xp_award_and_idempotency(student: User):
    db = SessionLocal()
    try:
        # First award
        awarded1 = gamification_service.award_xp(
            db, student.id, 50, "LESSON_COMPLETED", f"test_ref_1_{student.id}", "Completed Test Lesson"
        )
        assert awarded1 is True

        # Duplicate award with same reference key
        awarded2 = gamification_service.award_xp(
            db, student.id, 50, "LESSON_COMPLETED", f"test_ref_1_{student.id}", "Completed Test Lesson"
        )
        assert awarded2 is False
    finally:
        db.close()


def test_streak_calculation(student: User):
    db = SessionLocal()
    try:
        d1 = date(2026, 9, 20)
        d2 = date(2026, 9, 21)
        d3 = date(2026, 9, 21)  # Same day
        d4 = date(2026, 9, 25)  # Missed 3 days

        gam1 = gamification_service.record_activity_and_streak(db, student.id, d1)
        assert gam1.current_streak == 1

        gam2 = gamification_service.record_activity_and_streak(db, student.id, d2)
        assert gam2.current_streak == 2

        gam3 = gamification_service.record_activity_and_streak(db, student.id, d3)
        assert gam3.current_streak == 2  # Same day activity does not increment streak

        gam4 = gamification_service.record_activity_and_streak(db, student.id, d4)
        assert gam4.current_streak == 1  # Missed days reset streak to 1
    finally:
        db.close()


def test_lesson_completion_triggers(student: User):
    db = SessionLocal()
    try:
        # Trigger lesson completed
        lesson_id = 99911
        gamification_service.on_lesson_completed(db, student.id, lesson_id)

        gam = gamification_service.get_student_gamification(db, student.id)
        assert gam.total_xp >= 50

        # Verify First Step achievement unlocked
        first_step = next((a for a in gam.achievements if a.id == "FIRST_LESSON"), None)
        assert first_step is not None
        assert first_step.unlocked is True

        # Duplicate call does not duplicate XP
        xp_before = gam.total_xp
        gamification_service.on_lesson_completed(db, student.id, lesson_id)
        gam_after = gamification_service.get_student_gamification(db, student.id)
        assert gam_after.total_xp == xp_before
    finally:
        db.close()


def test_quiz_completion_triggers(student: User):
    db = SessionLocal()
    try:
        quiz = db.query(Quiz).first()
        if not quiz:
            # Create a mock quiz if none exists
            c = Course(title="Temp Course", instructor_id=student.id, published=True)
            db.add(c)
            db.commit()
            m = Module(course_id=c.id, title="Temp Module", order_number=1)
            db.add(m)
            db.commit()
            l = Lesson(module_id=m.id, title="Temp Lesson", order_number=1)
            db.add(l)
            db.commit()
            quiz = Quiz(lesson_id=l.id, title="Temp Quiz")
            db.add(quiz)
            db.commit()

        fake_attempt = QuizAttempt(
            quiz_id=quiz.id,
            student_id=student.id,
            score=90.0,
            total_points=100.0,
            percentage=90.0,
            completed_at=datetime.now(timezone.utc),
        )
        db.add(fake_attempt)
        db.commit()
        db.refresh(fake_attempt)

        xp_before = gamification_service.get_or_create_user_gamification(db, student.id).total_xp

        gamification_service.on_quiz_completed(db, student.id, fake_attempt)

        gam_after = gamification_service.get_student_gamification(db, student.id)
        # Expected 75 XP (quiz) + 25 XP (high score >= 80%) + 75 XP (daily quiz quest completion) = 175 XP
        assert gam_after.total_xp == xp_before + 175
    finally:
        db.close()


def test_gamification_me_endpoint_security(student: User):
    # Unauthenticated -> 401
    res = client.get("/api/v1/gamification/me")
    assert res.status_code == 401

    # Authenticated Student -> 200
    headers = _auth_header(student)
    res_auth = client.get("/api/v1/gamification/me", headers=headers)
    assert res_auth.status_code == 200
    data = res_auth.json()
    assert "total_xp" in data
    assert "level_info" in data
    assert "streak_info" in data
    assert "quests" in data
    assert "achievements" in data
