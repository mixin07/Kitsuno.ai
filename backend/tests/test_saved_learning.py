import uuid

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.jwt import create_access_token
from app.core.security import hash_password
from app.database import SessionLocal
from app.main import app
from app.models import Course, Enrollment, GamificationLog, Lesson, LessonProgress, Module, User, UserGamification, UserRole
from app.schemas.learning import LessonProgressUpdate
from app.services import enrollment_service, gamification_service, progress_service


def _create_saved_student() -> User:
    db = SessionLocal()
    try:
        user = User(
            name="Saved Student",
            email=f"saved_{uuid.uuid4().hex[:8]}@test.com",
            password_hash=hash_password("TestPassword123!"),
            role=UserRole.STUDENT,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def test_saved_learning_flow():
    student = _create_saved_student()
    client = TestClient(app)
    token = create_access_token(student.id)
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    try:
        course = db.scalar(select(Course).where(Course.published.is_(True)))
        assert course is not None
        lesson = db.scalar(
            select(Lesson)
            .join(Module, Lesson.module_id == Module.id)
            .where(Module.course_id == course.id)
        )
        assert lesson is not None

        # 1. Save Course
        r_save_c = client.post(f"/api/v1/saved/courses/{course.id}", headers=headers)
        assert r_save_c.status_code == 201

        # 2. Save Lesson
        r_save_l = client.post(f"/api/v1/saved/lessons/{lesson.id}", headers=headers)
        assert r_save_l.status_code == 201

        # 3. Save Notes
        note_payload = {
            "lesson_id": lesson.id,
            "course_id": course.id,
            "topic": lesson.title,
            "content": {
                "topic": lesson.title,
                "topic_overview": "Overview of lesson",
                "core_concepts": ["Concept A", "Concept B"],
                "quick_revision": ["Point 1"],
            },
        }
        r_save_n = client.post("/api/v1/saved/notes", json=note_payload, headers=headers)
        assert r_save_n.status_code == 201
        assert r_save_n.json()["topic"] == lesson.title

        # 4. Set Learning Status (Planning)
        r_status = client.put(
            f"/api/v1/saved/status/{course.id}",
            json={"status": "PLANNING"},
            headers=headers,
        )
        assert r_status.status_code == 200
        assert r_status.json()["status"] == "PLANNING"

        # 5. Check Overview
        r_ov = client.get("/api/v1/saved/overview", headers=headers)
        assert r_ov.status_code == 200
        ov_data = r_ov.json()
        assert course.id in ov_data["saved_course_ids"]
        assert lesson.id in ov_data["saved_lesson_ids"]
        assert lesson.id in ov_data["saved_note_lesson_ids"]
        assert ov_data["course_statuses"].get(str(course.id)) == "PLANNING"

        # 6. Verify List Endpoints
        r_courses = client.get("/api/v1/saved/courses", headers=headers)
        assert r_courses.status_code == 200
        assert any(c["course_id"] == course.id for c in r_courses.json())

        r_lessons = client.get("/api/v1/saved/lessons", headers=headers)
        assert r_lessons.status_code == 200
        assert any(l["lesson_id"] == lesson.id for l in r_lessons.json())

        r_notes = client.get("/api/v1/saved/notes", headers=headers)
        assert r_notes.status_code == 200
        assert any(n["lesson_id"] == lesson.id for n in r_notes.json())

        # 7. Unsave
        client.delete(f"/api/v1/saved/courses/{course.id}", headers=headers)
        client.delete(f"/api/v1/saved/lessons/{lesson.id}", headers=headers)
        client.delete(f"/api/v1/saved/notes/{lesson.id}", headers=headers)

        r_ov2 = client.get("/api/v1/saved/overview", headers=headers)
        assert course.id not in r_ov2.json()["saved_course_ids"]
        assert lesson.id not in r_ov2.json()["saved_lesson_ids"]
        assert lesson.id not in r_ov2.json()["saved_note_lesson_ids"]
    finally:
        u = db.scalar(select(User).where(User.id == student.id))
        if u:
            db.delete(u)
            db.commit()
        db.close()


def test_unenroll_preserves_progress_and_prevents_duplicate_xp():
    student = _create_saved_student()
    db = SessionLocal()
    try:
        course = db.scalar(select(Course).where(Course.published.is_(True)))
        assert course is not None
        lesson = db.scalar(
            select(Lesson)
            .join(Module, Lesson.module_id == Module.id)
            .where(Module.course_id == course.id)
        )
        assert lesson is not None

        # Clean prior state if any
        existing_enr = db.scalar(select(Enrollment).where(Enrollment.student_id == student.id, Enrollment.course_id == course.id))
        if existing_enr:
            db.delete(existing_enr)
            db.commit()

        # Step 1: Enroll in course
        enrollment_service.enroll_in_course(db, student.id, course.id)

        # Record initial XP
        gam_initial = gamification_service.get_or_create_user_gamification(db, student.id)
        initial_xp = gam_initial.total_xp

        # Step 2: Complete the lesson -> XP should increase by at least 50
        progress_service.update_lesson_progress(
            db, student.id, lesson.id, LessonProgressUpdate(completed=True)
        )
        gam_after_lesson = gamification_service.get_or_create_user_gamification(db, student.id)
        assert gam_after_lesson.total_xp >= initial_xp + 50
        expected_xp = gam_after_lesson.total_xp

        # Step 3: Complete the lesson again -> XP must NOT increase
        progress_service.update_lesson_progress(
            db, student.id, lesson.id, LessonProgressUpdate(completed=True)
        )
        gam_repeat = gamification_service.get_or_create_user_gamification(db, student.id)
        assert gam_repeat.total_xp == expected_xp

        # Step 4: Unenroll from course
        enrollment_service.unenroll_in_course(db, student.id, course.id)
        assert enrollment_service.get_enrollment(db, student.id, course.id) is None

        # XP must remain intact after unenrollment!
        gam_after_unenroll = gamification_service.get_or_create_user_gamification(db, student.id)
        assert gam_after_unenroll.total_xp == expected_xp

        # Step 5: Re-enroll in course
        enr_re = enrollment_service.enroll_in_course(db, student.id, course.id)
        assert enr_re is not None
        assert enr_re.progress == 0

        # Complete the lesson again after re-enrollment -> strictly NO duplicate XP
        progress_service.update_lesson_progress(
            db, student.id, lesson.id, LessonProgressUpdate(completed=True)
        )
        gam_after_reenroll = gamification_service.get_or_create_user_gamification(db, student.id)
        assert gam_after_reenroll.total_xp == expected_xp

        # Clean up
        enrollment_service.unenroll_in_course(db, student.id, course.id)
    finally:
        u = db.scalar(select(User).where(User.id == student.id))
        if u:
            db.delete(u)
            db.commit()
        db.close()
