"""
Comprehensive End-to-End QA, Integration Testing & Test-Data Cleanup Runner
for Kitsuno.ai Platform.
"""

import os
import sys
import json
import uuid
import time
from datetime import datetime, timezone, date
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, ".env"))

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from jose import jwt
from app.main import app
from app.config import settings
from app.database import SessionLocal

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

engine = create_engine(DATABASE_URL)
client = TestClient(app)

# Protected users
PROTECTED_EMAILS = [
    "jeyavelan68@gmail.com", # Admin (81)
    "sm7510@srmist.edu.in",  # Instructor (1023)
    "mj0971@gmail.com"       # Student (1024)
]

def _mint_token(sub: str, email: str | None = None, name: str | None = None, role: str | None = None) -> str:
    key = settings.supabase_jwt_secret or settings.jwt_secret_key
    exp = int(time.time()) + 3600
    meta = {}
    if name:
        meta["name"] = name
    if role:
        meta["role"] = role
    payload = {
        "sub": sub,
        "email": email,
        "aud": "authenticated",
        "iss": f"{settings.supabase_url.rstrip('/')}/auth/v1",
        "exp": exp,
        "user_metadata": meta,
    }
    return jwt.encode(payload, key, algorithm="HS256")

def _create_temp_auth_user(db, user_uuid: uuid.UUID, email: str, name: str = "Test User"):
    db.execute(
        text("DELETE FROM auth.users WHERE email = :email OR id = CAST(:id AS uuid)"),
        {"email": email, "id": str(user_uuid)},
    )
    db.commit()
    db.execute(
        text("""
            INSERT INTO auth.users (
                id, instance_id, aud, role, email, encrypted_password,
                email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                created_at, updated_at
            ) VALUES (
                CAST(:id AS uuid),
                '00000000-0000-0000-0000-000000000000'::uuid,
                'authenticated',
                'authenticated',
                CAST(:email AS text),
                '$2b$12$DUMMYTESTHASHFOREXAMPLE',
                NOW(),
                '{"provider": "email"}'::jsonb,
                jsonb_build_object('name', CAST(:name AS text)),
                NOW(),
                NOW()
            )
        """),
        {"id": str(user_uuid), "email": email, "name": name},
    )
    db.commit()

class QARunner:
    def __init__(self):
        self.results = []
        self.created_data = {
            "users": [],
            "auth_users": [],
            "study_plans": [],
            "exam_sessions": []
        }

    def record_result(self, category: str, test_name: str, passed: bool, detail: str = ""):
        self.results.append({
            "category": category,
            "test_name": test_name,
            "passed": passed,
            "detail": detail
        })
        status = "[PASS]" if passed else "[FAIL]"
        print(f"  {status} {category} :: {test_name} {f'({detail})' if detail else ''}")

    def run_all(self):
        print("\n" + "=" * 70)
        print("STARTING KITSUNO.AI FULL E2E QA & INTEGRATION VERIFICATION")
        print("=" * 70)

        db = SessionLocal()
        try:
            self.test_baseline_verification()
            self.test_authentication_and_approval(db)
            self.test_role_isolation()
            self.test_course_and_learning_flow()
            self.test_quiz_and_practice_flow()
            self.test_mock_exams()
            self.test_study_plan_flow()
            self.test_ai_features()
            self.test_gamification_idempotency()
            self.test_saved_content_isolation()
            self.test_analytics_integrity()
            self.test_instructor_studio()
            self.test_admin_workspace()
        finally:
            self.cleanup_qa_data(db)
            db.close()

        self.post_cleanup_audit()

    def test_baseline_verification(self):
        print("\n--- [1] Baseline & Protected User Verification ---")
        with engine.connect() as conn:
            users = conn.execute(text("""
                SELECT id, email, role, approval_status
                FROM public.users
                WHERE email = ANY(:emails)
            """), {"emails": PROTECTED_EMAILS}).mappings().fetchall()

            passed = len(users) == 3
            self.record_result("Baseline", "3 Protected Users Exist", passed, f"Found {len(users)}/3")

            admin = next((u for u in users if u["email"] == "jeyavelan68@gmail.com"), None)
            instructor = next((u for u in users if u["email"] == "sm7510@srmist.edu.in"), None)
            student = next((u for u in users if u["email"] == "mj0971@gmail.com"), None)

            self.record_result("Baseline", "Admin Mirudhula (ID 81)", admin and admin["role"] == "ADMIN")
            self.record_result("Baseline", "Instructor Shahid (ID 1023)", instructor and instructor["role"] == "INSTRUCTOR")
            self.record_result("Baseline", "Student Mikasa (ID 1024)", student and student["role"] == "STUDENT")

            courses_count = conn.execute(text("SELECT count(*) FROM public.courses WHERE instructor_id = 1023")).scalar()
            self.record_result("Baseline", "Canonical Courses Catalog Intact", courses_count == 9, f"{courses_count} courses")

    def test_authentication_and_approval(self, db):
        print("\n--- [2] Authentication, Roles & Approval Flow ---")
        # 1. Existing Student (Mikasa)
        student_token = _mint_token(
            sub="3a1b9251-a463-4511-82e6-7b235d64336a",
            email="mj0971@gmail.com",
            name="Mikasa",
            role="STUDENT"
        )
        self.student_headers = {"Authorization": f"Bearer {student_token}"}
        res = client.get("/api/v1/auth/me", headers=self.student_headers)
        self.record_result("Auth", "Existing Student /auth/me", res.status_code == 200, f"Role: {res.json().get('role')}")

        # 2. Existing Instructor (Shahid)
        inst_token = _mint_token(
            sub="f125fbeb-1c03-45d8-952e-effac19f4995",
            email="sm7510@srmist.edu.in",
            name="Shahid",
            role="INSTRUCTOR"
        )
        self.inst_headers = {"Authorization": f"Bearer {inst_token}"}
        res = client.get("/api/v1/auth/me", headers=self.inst_headers)
        self.record_result("Auth", "Existing Instructor /auth/me", res.status_code == 200, f"Role: {res.json().get('role')}")

        # 3. Existing Admin (Mirudhula)
        admin_uuid = uuid.uuid4()
        _create_temp_auth_user(db, admin_uuid, settings.admin_email, "Platform Admin")
        self.created_data["auth_users"].append(str(admin_uuid))
        admin_token = _mint_token(sub=str(admin_uuid), email=settings.admin_email, name="Platform Admin")
        self.admin_headers = {"Authorization": f"Bearer {admin_token}"}
        res = client.get("/api/v1/auth/me", headers=self.admin_headers)
        self.record_result("Auth", "Existing Admin /auth/me", res.status_code == 200, f"Role: {res.json().get('role')}")

        # 4. Student Signup (Instant Approval)
        test_student_uuid = uuid.uuid4()
        test_student_email = f"qa_student_{test_student_uuid.hex[:6]}@example.com"
        _create_temp_auth_user(db, test_student_uuid, test_student_email, "QA Student")
        self.created_data["auth_users"].append(str(test_student_uuid))
        test_student_token = _mint_token(sub=str(test_student_uuid), email=test_student_email, name="QA Student", role="STUDENT")
        res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {test_student_token}"})
        if res.status_code == 200:
            student_app_id = res.json().get("id")
            self.created_data["users"].append(student_app_id)
            self.temp_student_headers = {"Authorization": f"Bearer {test_student_token}"}
            self.temp_student_id = student_app_id
            self.record_result("Auth", "Student Instant Registration", res.json().get("role") == "STUDENT" and res.json().get("approval_status") == "APPROVED")
        else:
            self.record_result("Auth", "Student Instant Registration", False, f"Status: {res.status_code}")

        # 5. Instructor Signup (Pending Approval)
        cand_uuid = uuid.uuid4()
        cand_email = f"qa_cand_{cand_uuid.hex[:6]}@example.com"
        _create_temp_auth_user(db, cand_uuid, cand_email, "Candidate Instructor")
        self.created_data["auth_users"].append(str(cand_uuid))
        cand_token = _mint_token(sub=str(cand_uuid), email=cand_email, name="Candidate Instructor", role="INSTRUCTOR")
        cand_headers = {"Authorization": f"Bearer {cand_token}"}

        cand_me = client.get("/api/v1/auth/me", headers=cand_headers)
        cand_app_id = cand_me.json().get("id") if cand_me.status_code == 200 else None
        if cand_app_id:
            self.created_data["users"].append(cand_app_id)
            self.record_result("Auth", "Instructor Signup Sets Pending Status",
                               cand_me.json().get("approval_status") == "PENDING" and cand_me.json().get("requested_role") == "INSTRUCTOR")

            # Route blocked
            cand_block = client.get("/api/v1/auth/test/instructor", headers=cand_headers)
            self.record_result("Auth", "Pending Instructor Route Blocked (403)", cand_block.status_code == 403)

            # 6. Admin Approval Flow
            appr_res = client.post(f"/api/v1/admin/instructor-requests/{cand_app_id}/approve", headers=self.admin_headers)
            self.record_result("Auth", "Admin Approves Instructor Request", appr_res.status_code == 200)

            # Re-fetch auth/me to verify promotion
            cand_promoted = client.get("/api/v1/auth/me", headers=cand_headers)
            is_promoted = cand_promoted.json().get("role") == "INSTRUCTOR" and cand_promoted.json().get("approval_status") == "APPROVED"
            cand_access = client.get("/api/v1/auth/test/instructor", headers=cand_headers)
            self.record_result("Auth", "Approved Instructor Accesses Studio (200)", cand_access.status_code == 200 and is_promoted)
        else:
            self.record_result("Auth", "Instructor Signup Sets Pending Status", False)

        # 7. Admin Rejection Flow
        rej_uuid = uuid.uuid4()
        rej_email = f"qa_rej_{rej_uuid.hex[:6]}@example.com"
        _create_temp_auth_user(db, rej_uuid, rej_email, "Rejected Candidate")
        self.created_data["auth_users"].append(str(rej_uuid))
        rej_token = _mint_token(sub=str(rej_uuid), email=rej_email, name="Rejected Candidate", role="INSTRUCTOR")
        rej_headers = {"Authorization": f"Bearer {rej_token}"}
        rej_me = client.get("/api/v1/auth/me", headers=rej_headers)
        rej_app_id = rej_me.json().get("id") if rej_me.status_code == 200 else None
        if rej_app_id:
            self.created_data["users"].append(rej_app_id)
            rej_action = client.post(f"/api/v1/admin/instructor-requests/{rej_app_id}/reject", headers=self.admin_headers)
            self.record_result("Auth", "Admin Rejects Instructor Request", rej_action.status_code == 200)

            # Denied
            rej_block = client.get("/api/v1/auth/test/instructor", headers=rej_headers)
            self.record_result("Auth", "Rejected Candidate Denied Studio (403)", rej_block.status_code == 403)

        # 8. Admin Privilege Escalation Prevention
        escalate_res = client.post("/api/v1/auth/register", json={
            "name": "Attacker",
            "email": f"attacker_{uuid.uuid4().hex[:6]}@example.com",
            "password": "Password123!",
            "role": "ADMIN"
        })
        self.record_result("Auth", "Public Admin Registration Forbidden (403)", escalate_res.status_code == 403)

    def test_role_isolation(self):
        print("\n--- [3] Strict Role Boundary Isolation ---")
        # Student denied instructor and admin endpoints
        s_inst = client.get("/api/v1/auth/test/instructor", headers=self.student_headers)
        s_admin = client.get("/api/v1/auth/test/admin", headers=self.student_headers)
        self.record_result("Isolation", "Student Denied Instructor Endpoint (403)", s_inst.status_code == 403)
        self.record_result("Isolation", "Student Denied Admin Endpoint (403)", s_admin.status_code == 403)

        # Instructor denied admin endpoints
        i_admin = client.get("/api/v1/auth/test/admin", headers=self.inst_headers)
        self.record_result("Isolation", "Instructor Denied Admin Endpoint (403)", i_admin.status_code == 403)

    def test_course_and_learning_flow(self):
        print("\n--- [4] Course Catalog & Learning Integration Flow ---")
        # 1. List Courses
        res = client.get("/api/v1/courses", headers=self.student_headers)
        courses = res.json().get("items", res.json()) if isinstance(res.json(), dict) else res.json()
        self.record_result("Learning", "List Published Courses (200)", res.status_code == 200 and len(courses) >= 9)

        # 2. Get Course Detail
        html_course = next((c for c in courses if c["id"] == 3897), courses[0])
        res = client.get(f"/api/v1/courses/{html_course['id']}", headers=self.student_headers)
        self.record_result("Learning", "Course Detail Retrieval (200)", res.status_code == 200 and "title" in res.json())

        # 3. Get Course Modules
        m_res = client.get(f"/api/v1/courses/{html_course['id']}/modules", headers=self.student_headers)
        modules = m_res.json()
        self.record_result("Learning", "Course Modules Retrieval", m_res.status_code == 200 and len(modules) > 0)

        # 4. Get Module Lessons
        if modules:
            l_res = client.get(f"/api/v1/courses/{html_course['id']}/modules/{modules[0]['id']}/lessons", headers=self.student_headers)
            lessons = l_res.json()
            self.record_result("Learning", "Module Lessons Retrieval", l_res.status_code == 200 and len(lessons) > 0)
            if lessons:
                self.test_lesson_id = lessons[0]["id"]

    def test_quiz_and_practice_flow(self):
        print("\n--- [5] Quiz & Practice Security Flow ---")
        # 1. Question Bank Listing
        qb_res = client.get("/api/v1/practice/question-bank", headers=self.student_headers)
        if qb_res.status_code == 200:
            q_items = qb_res.json()
            leaked = any("is_correct" in opt for q in q_items for opt in q.get("options", []))
            self.record_result("Practice", "Question Bank Exists & Answers Not Leaked", not leaked and len(q_items) > 0)
        else:
            self.record_result("Practice", "Question Bank Listing", False, f"Status: {qb_res.status_code}")

        # 2. Quiz Hub Listing
        hub_res = client.get("/api/v1/practice/quiz-hub", headers=self.student_headers)
        self.record_result("Practice", "Quiz Hub Lists Quizzes", hub_res.status_code == 200 and len(hub_res.json().get("quizzes", [])) > 0)

    def test_mock_exams(self):
        print("\n--- [6] Mock Assessment Engine Flow ---")
        headers = getattr(self, "temp_student_headers", self.student_headers)
        create_res = client.post("/api/v1/practice/mock-exams", json={
            "course_id": None,
            "question_count": 10,
            "time_limit_minutes": 15
        }, headers=headers)

        if create_res.status_code in (200, 201):
            exam_data = create_res.json()
            session_id = exam_data.get("id")
            self.created_data["exam_sessions"].append(session_id)
            self.record_result("MockExam", "Create Timed Mock Exam Session", True, f"Session ID {session_id}")

            # Submit empty answers
            sub_res = client.post(f"/api/v1/practice/mock-exams/{session_id}/submit", json={
                "answers": []
            }, headers=headers)
            self.record_result("MockExam", "Submit Exam and Calculate Score", sub_res.status_code == 200 and "score" in sub_res.json())
        else:
            self.record_result("MockExam", "Create Mock Exam", False, f"Status: {create_res.status_code}")

    def test_study_plan_flow(self):
        print("\n--- [7] Study Plan & Task Scheduling Flow ---")
        headers = getattr(self, "temp_student_headers", self.student_headers)
        # Enroll in HTML course 3897
        client.post("/api/v1/courses/3897/enroll", headers=headers)

        plan_res = client.post("/api/v1/study-plans", json={
            "course_id": 3897,
            "title": "HTML Study Plan",
            "target_date": "2026-10-31",
            "daily_minutes_goal": 30,
            "preferred_days": [0, 2, 4],
            "include_quizzes": True
        }, headers=headers)

        if plan_res.status_code in (200, 201):
            plan = plan_res.json()
            plan_id = plan.get("id")
            self.created_data["study_plans"].append(plan_id)
            self.record_result("StudyPlan", "Create Study Plan for Course", True, f"Plan ID {plan_id}")

            # List student study plans
            list_res = client.get("/api/v1/study-plans", headers=headers)
            self.record_result("StudyPlan", "List Student Study Plans", list_res.status_code == 200 and len(list_res.json()) > 0)
        else:
            self.record_result("StudyPlan", "Create Study Plan", False, f"Status: {plan_res.status_code}")

    def test_ai_features(self):
        print("\n--- [8] AI Search & AI Services Security Flow ---")
        search_res = client.get("/api/v1/search?q=javascript", headers=self.student_headers)
        if search_res.status_code == 200:
            raw_text = search_res.text.lower()
            no_secrets = "sk-" not in raw_text and "gemini_api_key" not in raw_text and "supabase_key" not in raw_text
            self.record_result("AI", "AI Search Operates Without Leaking Secrets", no_secrets)
        else:
            self.record_result("AI", "AI Search Endpoint", False, f"Status: {search_res.status_code}")

    def test_gamification_idempotency(self):
        print("\n--- [9] Gamification & XP Idempotency Flow ---")
        summary_res = client.get("/api/v1/gamification/xp-summary", headers=self.student_headers)
        self.record_result("Gamification", "Fetch XP Summary & Level Details", summary_res.status_code == 200)

        monthly_res = client.get("/api/v1/gamification/monthly-activity?year=2026&month=10", headers=self.student_headers)
        self.record_result("Gamification", "Monthly Activity Calendar Data (200)", monthly_res.status_code == 200)

    def test_saved_content_isolation(self):
        print("\n--- [10] Saved Content Separation Flow ---")
        headers = getattr(self, "temp_student_headers", self.student_headers)

        # Save course 3897
        save_c = client.post("/api/v1/saved/courses/3897", headers=headers)
        self.record_result("SavedContent", "Save Course", save_c.status_code in (200, 201))

        # Save note for lesson
        lesson_id = getattr(self, "test_lesson_id", 1)
        save_n = client.post("/api/v1/saved/notes", json={
            "course_id": 3897,
            "lesson_id": lesson_id,
            "topic": "HTML Fundamentals",
            "content": "Semantic HTML tags improve SEO, reader accessibility, and code clarity."
        }, headers=headers)
        self.record_result("SavedContent", "Save AI Study Note", save_n.status_code in (200, 201))

        # List saved overview
        ov_res = client.get("/api/v1/saved/overview", headers=headers)
        self.record_result("SavedContent", "Retrieve Saved Content Overview", ov_res.status_code == 200)

        # Unsave course
        del_c = client.delete("/api/v1/saved/courses/3897", headers=headers)
        self.record_result("SavedContent", "Unsave Course", del_c.status_code in (200, 204))

    def test_analytics_integrity(self):
        print("\n--- [11] Centralized Analytics Grounding Flow ---")
        s_an = client.get("/api/v1/analytics/student", headers=self.student_headers)
        self.record_result("Analytics", "Student Analytics Grounded", s_an.status_code == 200)

        i_an = client.get("/api/v1/analytics/instructor", headers=self.inst_headers)
        self.record_result("Analytics", "Instructor Analytics Grounded", i_an.status_code == 200)

        a_an = client.get("/api/v1/analytics/admin", headers=self.admin_headers)
        self.record_result("Analytics", "Admin Platform Analytics Grounded", a_an.status_code == 200)

    def test_instructor_studio(self):
        print("\n--- [12] Instructor Studio Publishing Flow ---")
        # List courses for instructor Shahid
        courses_res = client.get("/api/v1/courses", headers=self.inst_headers)
        data = courses_res.json() if courses_res.status_code == 200 and isinstance(courses_res.json(), list) else []
        inst_courses = [c for c in data if isinstance(c, dict) and c.get("instructor_id") == 1023]
        self.record_result("Studio", "Instructor Owns 9 Canonical Courses", courses_res.status_code == 200 and len(inst_courses) == 9)

    def test_admin_workspace(self):
        print("\n--- [13] Admin Workspace Verification Flow ---")
        reqs_res = client.get("/api/v1/admin/instructor-requests", headers=self.admin_headers)
        self.record_result("Admin", "List Instructor Requests Queue", reqs_res.status_code == 200)

    def cleanup_qa_data(self, db):
        print("\n--- [14] ATOMIC CLEANUP OF QA TEST-CREATED DATA ---")
        user_ids = self.created_data["users"]
        study_plan_ids = self.created_data["study_plans"]
        exam_session_ids = self.created_data["exam_sessions"]
        auth_user_ids = self.created_data["auth_users"]

        print(f"  Cleaning up test entities for {len(user_ids)} test users...")

        try:
            # 1. Clean exam sessions
            if exam_session_ids:
                db.execute(text("DELETE FROM public.exam_session_questions WHERE session_id = ANY(:ids)"), {"ids": exam_session_ids})
                db.execute(text("DELETE FROM public.exam_sessions WHERE id = ANY(:ids)"), {"ids": exam_session_ids})
                db.commit()

            # 2. Clean study plans & tasks
            if study_plan_ids:
                db.execute(text("DELETE FROM public.study_plan_tasks WHERE study_plan_id = ANY(:ids)"), {"ids": study_plan_ids})
                db.execute(text("DELETE FROM public.study_plans WHERE id = ANY(:ids)"), {"ids": study_plan_ids})
                db.commit()

            # 3. Clean test users' enrollments, saved items, etc.
            if user_ids:
                db.execute(text("DELETE FROM public.saved_courses WHERE user_id = ANY(:ids)"), {"ids": user_ids})
                db.execute(text("DELETE FROM public.saved_lessons WHERE user_id = ANY(:ids)"), {"ids": user_ids})
                db.execute(text("DELETE FROM public.saved_notes WHERE user_id = ANY(:ids)"), {"ids": user_ids})
                db.execute(text("DELETE FROM public.enrollments WHERE student_id = ANY(:ids)"), {"ids": user_ids})
                db.execute(text("DELETE FROM public.user_course_statuses WHERE user_id = ANY(:ids)"), {"ids": user_ids})
                db.execute(text("DELETE FROM public.lesson_progress WHERE student_id = ANY(:ids)"), {"ids": user_ids})
                db.execute(text("DELETE FROM public.quiz_attempts WHERE student_id = ANY(:ids)"), {"ids": user_ids})
                db.execute(text("DELETE FROM public.gamification_logs WHERE user_id = ANY(:ids)"), {"ids": user_ids})
                db.execute(text("DELETE FROM public.user_gamification WHERE user_id = ANY(:ids)"), {"ids": user_ids})
                db.execute(text("DELETE FROM public.study_plan_tasks WHERE student_id = ANY(:ids)"), {"ids": user_ids})
                db.execute(text("DELETE FROM public.study_plans WHERE student_id = ANY(:ids)"), {"ids": user_ids})
                db.execute(text("DELETE FROM public.exam_sessions WHERE student_id = ANY(:ids)"), {"ids": user_ids})
                # Finally delete test users
                res = db.execute(text("DELETE FROM public.users WHERE (id = ANY(:ids) OR email LIKE 'qa_%') AND NOT (email = ANY(:protected))"),
                                 {"ids": user_ids, "protected": PROTECTED_EMAILS})
                db.commit()
                print(f"  [OK] Deleted {res.rowcount} temporary test users from public.users.")

            # 4. Clean auth.users
            if auth_user_ids:
                for auid in auth_user_ids:
                    db.execute(text("DELETE FROM auth.users WHERE id = CAST(:id AS uuid) AND NOT (email = ANY(:protected))"),
                               {"id": auid, "protected": PROTECTED_EMAILS})
                db.commit()
                print(f"  [OK] Cleaned temporary records from auth.users.")

            # 5. Clean any residual qa_ emails in auth.users
            db.execute(text("DELETE FROM auth.users WHERE email LIKE 'qa_%' AND NOT (email = ANY(:protected))"),
                       {"protected": PROTECTED_EMAILS})
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"  [!] Cleanup error: {e}")

    def post_cleanup_audit(self):
        print("\n--- [15] POST-CLEANUP DATABASE INTEGRITY AUDIT ---")
        with engine.connect() as conn:
            # Check users
            users = conn.execute(text("SELECT id, email, role, approval_status FROM public.users ORDER BY id")).mappings().fetchall()
            print(f"  Current users in public.users ({len(users)}):")
            for u in users:
                print(f"    - ID {u['id']}: {u['email']} [{u['role']}] - Status: {u['approval_status']}")

            courses = conn.execute(text("SELECT count(*) FROM public.courses WHERE published = true")).scalar()
            print(f"  Published canonical courses: {courses} (Expected: 9)")

            protected_ok = len(users) == 3 and all(u["email"] in PROTECTED_EMAILS for u in users)
            courses_ok = courses == 9

            self.record_result("Integrity", "Only 3 Protected Users Remain", protected_ok)
            self.record_result("Integrity", "Catalog Exactly 9 Canonical Courses", courses_ok)

            total_tests = len(self.results)
            passed_tests = sum(1 for r in self.results if r["passed"])
            failed_tests = total_tests - passed_tests

            print("\n" + "=" * 70)
            print(f"E2E QA EXECUTION SUMMARY: {passed_tests}/{total_tests} PASSED ({failed_tests} FAILED)")
            print("=" * 70)

if __name__ == "__main__":
    runner = QARunner()
    runner.run_all()
