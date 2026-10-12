import time
import uuid
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import delete, select, text

from app.config import settings
from app.core.jwt import create_access_token
from app.core.security import hash_password
from app.database import SessionLocal
from app.main import app
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.models.study_plan import PlanStatus, StudyPlan, StudyPlanTask, TaskStatus
from app.models.user import User, UserRole

client = TestClient(app)


def _mint_token(
    sub: str,
    email: str | None = None,
    name: str | None = None,
    secret: str | None = None,
) -> str:
    key = secret or settings.supabase_jwt_secret or settings.jwt_secret_key
    exp = int(time.time()) + 3600
    payload = {
        "sub": sub,
        "email": email,
        "aud": "authenticated",
        "iss": f"{settings.supabase_url.rstrip('/')}/auth/v1",
        "exp": exp,
        "user_metadata": {"name": name} if name else {},
    }
    return jwt.encode(payload, key, algorithm="HS256")


def _create_isolated_student(db):
    test_user = User(
        name="Study Plan Tester",
        email=f"plan_test_{uuid.uuid4().hex[:8]}@test.com",
        role=UserRole.STUDENT,
        password_hash=hash_password("TestPassword123!"),
        is_active=True,
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    token = create_access_token(str(test_user.id))
    return test_user, token


def _cleanup_isolated_student(db, user_id):
    try:
        db.execute(delete(StudyPlanTask).where(StudyPlanTask.student_id == user_id))
        db.execute(delete(StudyPlan).where(StudyPlan.student_id == user_id))
        db.execute(delete(LessonProgress).where(LessonProgress.student_id == user_id))
        db.execute(delete(Enrollment).where(Enrollment.student_id == user_id))
        db.execute(delete(User).where(User.id == user_id))
        db.commit()
    except Exception:
        db.rollback()


def test_unauthenticated_cannot_access_study_plans():
    assert client.get("/api/v1/study-plans").status_code == 401
    assert client.post("/api/v1/study-plans", json={}).status_code == 401
    assert client.get("/api/v1/study-plans/today").status_code == 401
    assert client.get("/api/v1/study-plans/weekly").status_code == 401


def test_instructor_and_admin_cannot_access_student_study_plans():
    db = SessionLocal()
    try:
        instructor = db.scalar(select(User).where(User.email == "sm7510@srmist.edu.in"))
        assert instructor and instructor.auth_user_id

        inst_token = _mint_token(sub=str(instructor.auth_user_id), email=instructor.email)
        headers = {"Authorization": f"Bearer {inst_token}"}

        # Instructor must receive 403 Forbidden
        assert client.get("/api/v1/study-plans", headers=headers).status_code == 403
        assert client.get("/api/v1/study-plans/today", headers=headers).status_code == 403
    finally:
        db.close()


def test_empty_student_study_plans():
    """Verify production student Mikasa starts with empty study plans."""
    db = SessionLocal()
    try:
        student = db.scalar(select(User).where(User.email == "mj0971@gmail.com"))
        assert student and student.auth_user_id

        token = _mint_token(sub=str(student.auth_user_id), email=student.email)
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.get("/api/v1/study-plans", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 0, "Mikasa study plan list must start empty"

        today_resp = client.get("/api/v1/study-plans/today", headers=headers)
        assert today_resp.status_code == 200
        assert today_resp.json()["total_tasks"] == 0
    finally:
        db.close()


def test_student_create_plan_and_deterministic_task_generation():
    db = SessionLocal()
    student, token = _create_isolated_student(db)
    created_plan_id = None
    try:
        course = db.scalar(select(Course).where(Course.title == "Introduction to HTML"))
        assert course is not None

        headers = {"Authorization": f"Bearer {token}"}

        target_date = (date.today() + timedelta(days=14)).isoformat()
        payload = {
            "course_id": course.id,
            "target_date": target_date,
            "daily_minutes_goal": 30,
            "preferred_days": [0, 1, 2, 3, 4, 5],
        }

        resp = client.post("/api/v1/study-plans", headers=headers, json=payload)
        assert resp.status_code == 201
        data = resp.json()

        created_plan_id = data["id"]
        assert data["student_id"] == student.id
        assert data["course_id"] == course.id
        assert len(data["tasks"]) > 0
        assert data["health_status"] in ("ON_TRACK", "AHEAD")

        # Verify all tasks reference real curriculum items and order is ascending
        prev_date = date.fromisoformat(data["tasks"][0]["scheduled_date"])
        for task in data["tasks"]:
            assert task["course_id"] == course.id
            assert task["task_type"] in ("LESSON", "QUIZ")
            if task["task_type"] == "LESSON":
                assert task["lesson_id"] is not None
            current_date = date.fromisoformat(task["scheduled_date"])
            assert current_date >= prev_date
            prev_date = current_date

        # Fetch detail by id
        detail_resp = client.get(f"/api/v1/study-plans/{created_plan_id}", headers=headers)
        assert detail_resp.status_code == 200
        assert detail_resp.json()["id"] == created_plan_id
        assert len(detail_resp.json()["tasks"]) == len(data["tasks"])

    finally:
        if created_plan_id:
            plan = db.scalar(select(StudyPlan).where(StudyPlan.id == created_plan_id))
            if plan:
                db.delete(plan)
                db.commit()
        _cleanup_isolated_student(db, student.id)
        db.close()


def test_target_date_validation():
    db = SessionLocal()
    student, token = _create_isolated_student(db)
    try:
        course = db.scalar(select(Course).where(Course.published == True))
        headers = {"Authorization": f"Bearer {token}"}

        # Target date in past must fail with 400
        past_date = (date.today() - timedelta(days=5)).isoformat()
        payload = {
            "course_id": course.id,
            "target_date": past_date,
            "daily_minutes_goal": 30,
        }
        resp = client.post("/api/v1/study-plans", headers=headers, json=payload)
        assert resp.status_code == 400
        assert "Target completion date must be today or in the future" in resp.json()["detail"]
    finally:
        _cleanup_isolated_student(db, student.id)
        db.close()


def test_task_completion_and_bidirectional_progress_sync():
    db = SessionLocal()
    student, token = _create_isolated_student(db)
    created_plan_id = None
    try:
        course = db.scalar(select(Course).where(Course.title == "Introduction to HTML"))
        assert course is not None

        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create a study plan
        target_date = (date.today() + timedelta(days=7)).isoformat()
        resp = client.post(
            "/api/v1/study-plans",
            headers=headers,
            json={
                "course_id": course.id,
                "target_date": target_date,
                "daily_minutes_goal": 30,
            },
        )
        assert resp.status_code == 201
        plan_data = resp.json()
        created_plan_id = plan_data["id"]

        first_lesson_task = next(
            t for t in plan_data["tasks"] if t["task_type"] == "LESSON" and t["lesson_id"] is not None
        )
        task_id = first_lesson_task["id"]
        lesson_id = first_lesson_task["lesson_id"]

        # 2. Complete task via Study Plan API
        comp_resp = client.post(f"/api/v1/study-plans/tasks/{task_id}/complete", headers=headers)
        assert comp_resp.status_code == 200
        assert comp_resp.json()["status"] == "COMPLETED"

        # 3. Verify that real LessonProgress in DB was also updated
        lp = db.scalar(
            select(LessonProgress).where(
                LessonProgress.student_id == student.id, LessonProgress.lesson_id == lesson_id
            )
        )
        assert lp is not None
        assert lp.completed is True

        # 4. Now test the reverse direction: complete a different lesson via standard learning API
        second_lesson_task = next(
            t
            for t in plan_data["tasks"]
            if t["task_type"] == "LESSON"
            and t["lesson_id"] is not None
            and t["id"] != task_id
            and t["status"] == "PENDING"
        )
        second_task_id = second_lesson_task["id"]
        second_lesson_id = second_lesson_task["lesson_id"]

        # Complete via standard learning route: PATCH /api/v1/progress/lessons/{lesson_id}
        prog_resp = client.patch(
            f"/api/v1/progress/lessons/{second_lesson_id}",
            headers=headers,
            json={"completed": True, "watch_time": 120.0},
        )
        assert prog_resp.status_code == 200
        assert prog_resp.json()["completed"] is True

        # Verify second study plan task is now automatically COMPLETED!
        refreshed_plan = client.get(f"/api/v1/study-plans/{created_plan_id}", headers=headers).json()
        matching_task = next(t for t in refreshed_plan["tasks"] if t["id"] == second_task_id)
        assert matching_task["status"] == "COMPLETED"

    finally:
        if created_plan_id:
            plan = db.scalar(select(StudyPlan).where(StudyPlan.id == created_plan_id))
            if plan:
                db.delete(plan)
                db.commit()
        _cleanup_isolated_student(db, student.id)
        db.close()


def test_task_rescheduling():
    db = SessionLocal()
    student, token = _create_isolated_student(db)
    created_plan_id = None
    try:
        course = db.scalar(select(Course).where(Course.published == True))
        headers = {"Authorization": f"Bearer {token}"}

        # Create plan with 5 days
        target_date = (date.today() + timedelta(days=5)).isoformat()
        resp = client.post(
            "/api/v1/study-plans",
            headers=headers,
            json={
                "course_id": course.id,
                "target_date": target_date,
                "daily_minutes_goal": 20,
            },
        )
        created_plan_id = resp.json()["id"]

        # Reschedule with extended target date
        new_target_date = (date.today() + timedelta(days=15)).isoformat()
        resched_resp = client.post(
            f"/api/v1/study-plans/{created_plan_id}/reschedule",
            headers=headers,
            json={
                "new_target_date": new_target_date,
                "daily_minutes_goal": 45,
            },
        )
        assert resched_resp.status_code == 200
        resched_data = resched_resp.json()
        assert resched_data["daily_minutes_goal"] == 45
        assert len(resched_data["tasks"]) > 0

    finally:
        if created_plan_id:
            plan = db.scalar(select(StudyPlan).where(StudyPlan.id == created_plan_id))
            if plan:
                db.delete(plan)
                db.commit()
        _cleanup_isolated_student(db, student.id)
        db.close()


def test_weekly_and_today_views():
    db = SessionLocal()
    student, token = _create_isolated_student(db)
    created_plan_id = None
    try:
        course = db.scalar(select(Course).where(Course.published == True))
        headers = {"Authorization": f"Bearer {token}"}

        # Create active plan
        resp = client.post(
            "/api/v1/study-plans",
            headers=headers,
            json={
                "course_id": course.id,
                "target_date": (date.today() + timedelta(days=7)).isoformat(),
                "daily_minutes_goal": 30,
            },
        )
        created_plan_id = resp.json()["id"]

        # Test Today endpoint
        today_resp = client.get("/api/v1/study-plans/today", headers=headers)
        assert today_resp.status_code == 200
        today_data = today_resp.json()
        assert "tasks" in today_data
        assert "daily_minutes_goal" in today_data

        # Test Weekly endpoint
        weekly_resp = client.get("/api/v1/study-plans/weekly", headers=headers)
        assert weekly_resp.status_code == 200
        weekly_data = weekly_resp.json()
        assert len(weekly_data["days"]) == 7

    finally:
        if created_plan_id:
            plan = db.scalar(select(StudyPlan).where(StudyPlan.id == created_plan_id))
            if plan:
                db.delete(plan)
                db.commit()
        _cleanup_isolated_student(db, student.id)
        db.close()


def test_delete_study_plan_preserves_learning_progress():
    db = SessionLocal()
    student, token = _create_isolated_student(db)
    created_plan_id = None
    try:
        course = db.scalar(select(Course).where(Course.published == True))
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.post(
            "/api/v1/study-plans",
            headers=headers,
            json={
                "course_id": course.id,
                "target_date": (date.today() + timedelta(days=10)).isoformat(),
            },
        )
        created_plan_id = resp.json()["id"]

        # Complete a task
        first_task = resp.json()["tasks"][0]
        client.post(f"/api/v1/study-plans/tasks/{first_task['id']}/complete", headers=headers)

        # Delete the study plan
        del_resp = client.delete(f"/api/v1/study-plans/{created_plan_id}", headers=headers)
        assert del_resp.status_code == 204

        # Verify plan is gone
        assert client.get(f"/api/v1/study-plans/{created_plan_id}", headers=headers).status_code == 404

        # Verify course and lesson progress are STILL INTACT!
        db_course = db.scalar(select(Course).where(Course.id == course.id))
        assert db_course is not None, "Course must not be deleted when plan is deleted!"

        if first_task.get("lesson_id"):
            lp = db.scalar(
                select(LessonProgress).where(
                    LessonProgress.student_id == student.id,
                    LessonProgress.lesson_id == first_task["lesson_id"],
                )
            )
            assert lp is not None and lp.completed is True, "Lesson progress must remain intact!"

    finally:
        _cleanup_isolated_student(db, student.id)
        db.close()


def test_student_cannot_access_another_students_plan():
    """Verify Student B cannot view or modify Student A's study plan."""
    db = SessionLocal()
    student_a, token_a = _create_isolated_student(db)
    student_b, token_b = _create_isolated_student(db)
    plan_id = None

    try:
        course = db.scalar(select(Course).where(Course.published == True))
        headers_a = {"Authorization": f"Bearer {token_a}"}
        headers_b = {"Authorization": f"Bearer {token_b}"}

        # Create plan for Student A
        resp = client.post(
            "/api/v1/study-plans",
            headers=headers_a,
            json={
                "course_id": course.id,
                "target_date": (date.today() + timedelta(days=5)).isoformat(),
            },
        )
        plan_id = resp.json()["id"]

        # Student B tries to fetch Student A's plan -> 404
        assert client.get(f"/api/v1/study-plans/{plan_id}", headers=headers_b).status_code == 404

        # Student B tries to delete Student A's plan -> 404
        assert client.delete(f"/api/v1/study-plans/{plan_id}", headers=headers_b).status_code == 404

        # Student B tries to complete Student A's task -> 404
        first_task_id = resp.json()["tasks"][0]["id"]
        assert client.post(f"/api/v1/study-plans/tasks/{first_task_id}/complete", headers=headers_b).status_code == 404

    finally:
        if plan_id:
            plan = db.scalar(select(StudyPlan).where(StudyPlan.id == plan_id))
            if plan:
                db.delete(plan)
                db.commit()
        _cleanup_isolated_student(db, student_a.id)
        _cleanup_isolated_student(db, student_b.id)
        db.close()


def test_overdue_tasks_detected_and_health():
    """Verify overdue tasks trigger proper status and health warning."""
    db = SessionLocal()
    student, token = _create_isolated_student(db)
    plan_id = None
    try:
        course = db.scalar(select(Course).where(Course.published == True))
        headers = {"Authorization": f"Bearer {token}"}

        resp = client.post(
            "/api/v1/study-plans",
            headers=headers,
            json={
                "course_id": course.id,
                "target_date": (date.today() + timedelta(days=10)).isoformat(),
            },
        )
        plan_id = resp.json()["id"]
        task_id = resp.json()["tasks"][0]["id"]

        # Explicitly mark task as PENDING and backdate to yesterday
        task = db.scalar(select(StudyPlanTask).where(StudyPlanTask.id == task_id))
        task.status = TaskStatus.PENDING
        task.completed_at = None
        task.scheduled_date = date.today() - timedelta(days=1)
        db.commit()

        # Check detail response
        detail = client.get(f"/api/v1/study-plans/{plan_id}", headers=headers).json()
        assert detail["overdue_tasks"] >= 1
        assert detail["health_status"] == "AT_RISK"

        # Check today endpoint contains the overdue task
        today_data = client.get("/api/v1/study-plans/today", headers=headers).json()
        assert today_data["overdue_tasks_count"] >= 1
        assert any(t["id"] == task_id for t in today_data["overdue_tasks"])

    finally:
        if plan_id:
            plan = db.scalar(select(StudyPlan).where(StudyPlan.id == plan_id))
            if plan:
                db.delete(plan)
                db.commit()
        _cleanup_isolated_student(db, student.id)
        db.close()
