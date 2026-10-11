"""
Baseline Audit Script for Kitsuno.ai End-to-End QA
Verifies the 3 protected users and records baseline counts for all core entities.
"""

import os
import sys
import json
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env from backend/.env
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment.")
    sys.exit(1)

# Fix asyncpg if present in URL
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

engine = create_engine(DATABASE_URL)

def run_baseline_audit():
    with engine.connect() as conn:
        print("=" * 60)
        print("KITSUNO.AI QA BASELINE SNAPSHOT & PROTECTED USER AUDIT")
        print("=" * 60)

        # 1. Verify Protected Users
        protected_emails = [
            "jeyavelan68@gmail.com",
            "sm7510@srmist.edu.in",
            "mj0971@gmail.com"
        ]

        users_query = text("""
            SELECT id, auth_user_id, email, name, role, approval_status, requested_role
            FROM public.users
            WHERE email = ANY(:emails)
            ORDER BY id
        """)
        protected_users = conn.execute(users_query, {"emails": protected_emails}).mappings().fetchall()

        print(f"\n[1] Protected Users in public.users: Found {len(protected_users)}/3")
        for u in protected_users:
            print(f"  • ID: {u['id']} | Email: {u['email']} | Role: {u['role']} | Status: {u['approval_status']} | AuthID: {u['auth_user_id']}")

        # Verify in auth.users
        auth_query = text("""
            SELECT id, email
            FROM auth.users
            WHERE email = ANY(:emails)
        """)
        auth_users = conn.execute(auth_query, {"emails": protected_emails}).mappings().fetchall()
        print(f"\n[2] Protected Users in auth.users: Found {len(auth_users)}/3")
        for au in auth_users:
            print(f"  • Auth ID: {au['id']} | Email: {au['email']}")

        # 2. Record Baseline Database Counts & IDs
        counts = {}
        tables = [
            "courses",
            "modules",
            "lessons",
            "quizzes",
            "questions",
            "options",
            "study_plans",
            "study_plan_tasks",
            "gamification_logs",
            "user_gamification",
            "saved_courses",
            "saved_lessons",
            "saved_notes",
            "quiz_attempts",
            "attempt_answers",
            "enrollments",
            "lesson_progress",
            "users"
        ]

        for t in tables:
            try:
                cnt = conn.execute(text(f"SELECT COUNT(*) FROM public.{t}")).scalar()
                counts[t] = cnt
            except Exception as e:
                counts[t] = f"Error: {e}"

        print("\n[3] Baseline Table Counts:")
        for tbl, c in counts.items():
            print(f"  • {tbl}: {c}")

        # Canonical Course IDs
        courses = conn.execute(text("SELECT id, title, published, instructor_id FROM public.courses ORDER BY id")).mappings().fetchall()
        print(f"\n[4] Existing Courses ({len(courses)} total):")
        course_list = []
        for c in courses:
            print(f"  • ID {c['id']}: '{c['title']}' (Published: {c['published']}, Instructor: {c['instructor_id']})")
            course_list.append({"id": c['id'], "title": c['title'], "instructor_id": c['instructor_id']})

        baseline_data = {
            "protected_users": [dict(u) for u in protected_users],
            "counts": counts,
            "courses": course_list
        }

        # Save to backend/scripts/qa_baseline.json
        output_file = os.path.join(backend_dir, "scripts", "qa_baseline.json")
        with open(output_file, "w") as f:
            json.dump(baseline_data, f, indent=2, default=str)
        print(f"\n[OK] Baseline recorded and saved to {output_file}")

if __name__ == "__main__":
    run_baseline_audit()
