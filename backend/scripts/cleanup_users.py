import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.database import engine

TARGET_UNWANTED_EMAILS = [
    "saiganesh22472@gmail.com",  # ID 1022
    "test@gmail.com",            # ID 3822
]

RETAINED_EMAILS = [
    "sm7510@srmist.edu.in",      # Shahid (INSTRUCTOR) - ID 1023
    "mj0971@gmail.com",          # Mikasa (STUDENT) - ID 1024
    "jeyavelan68@gmail.com",     # Admin - ID 81
]

def cleanup():
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            print("=== STARTING USER CLEANUP ===")
            # 1. Fetch unwanted users
            unwanted = conn.execute(
                text("SELECT id, email, role FROM public.users WHERE email = ANY(:emails)"),
                {"emails": TARGET_UNWANTED_EMAILS}
            ).fetchall()

            if not unwanted:
                print("No unwanted users found in public.users.")
                return

            unwanted_ids = [u[0] for u in unwanted]
            print(f"Targeting unwanted users: {unwanted}")
            print(f"Target IDs: {unwanted_ids}")

            # Verify none of them owns a course
            courses_owned = conn.execute(
                text("SELECT count(*) FROM courses WHERE instructor_id = ANY(:uids)"),
                {"uids": unwanted_ids}
            ).scalar()
            assert courses_owned == 0, f"ABORT: Unwanted user owns {courses_owned} courses!"

            # 2. Delete child records in safe order
            child_tables = [
                ("gamification_logs", "user_id"),
                ("user_quest_progress", "user_id"),
                ("user_achievements", "user_id"),
                ("game_attempts", "user_id"),
                ("user_gamification", "user_id"),
                ("user_course_statuses", "user_id"),
                ("saved_courses", "user_id"),
                ("saved_lessons", "user_id"),
                ("saved_notes", "user_id"),
                ("lesson_progress", "student_id"),
                ("quiz_attempts", "student_id"),
                ("enrollments", "student_id"),
            ]

            for tbl, col in child_tables:
                res = conn.execute(
                    text(f"DELETE FROM {tbl} WHERE {col} = ANY(:uids)"),
                    {"uids": unwanted_ids}
                )
                print(f"Deleted {res.rowcount} rows from {tbl}.{col}")

            # 3. Delete from public.users
            res = conn.execute(
                text("DELETE FROM public.users WHERE id = ANY(:uids)"),
                {"uids": unwanted_ids}
            )
            print(f"Deleted {res.rowcount} rows from public.users")

            # 4. Also ensure neither is in auth.users
            auth_res = conn.execute(
                text("DELETE FROM auth.users WHERE email = ANY(:emails)"),
                {"emails": TARGET_UNWANTED_EMAILS}
            )
            print(f"Deleted {auth_res.rowcount} rows from auth.users (if any)")

            # Commit transaction
            trans.commit()
            print("\n[OK] User cleanup transaction committed successfully!")

        except Exception as e:
            trans.rollback()
            print("\n[FAIL] User cleanup failed, rolled back:", e)
            raise e

def verify():
    with engine.connect() as conn:
        print("\n=== POST-CLEANUP VERIFICATION ===")
        remaining_users = conn.execute(
            text("SELECT id, name, email, role, auth_user_id FROM public.users ORDER BY id")
        ).fetchall()
        print(f"Total public.users remaining: {len(remaining_users)}")
        for u in remaining_users:
            print(f"  ID: {u[0]:<4} | Email: {u[2]:<25} | Role: {u[3]:<10} | Auth ID: {u[4]}")

        remaining_auth = conn.execute(
            text("SELECT id, email, created_at FROM auth.users ORDER BY created_at")
        ).fetchall()
        print(f"\nTotal auth.users: {len(remaining_auth)}")
        for au in remaining_auth:
            print(f"  ID: {au[0]} | Email: {au[1]}")

        # Verify courses
        courses = conn.execute(text("SELECT count(*) FROM courses WHERE published = true")).scalar()
        print(f"\nTotal published courses: {courses} (Must be exactly 9)")

if __name__ == "__main__":
    cleanup()
    verify()
