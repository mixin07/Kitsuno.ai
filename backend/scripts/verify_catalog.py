import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app.models import Course, User, UserRole
from app.services import course_service, enrollment_service, progress_service

def verify():
    db = SessionLocal()
    try:
        student = db.query(User).filter(User.role == UserRole.STUDENT).first()
        print(f"Testing with student: {student.email} (ID: {student.id})")

        # 1. Test list_visible_courses
        courses = course_service.list_visible_courses(db, student)
        print(f"Total visible courses: {len(courses)}")
        assert len(courses) == 9, f"Expected 9 courses, got {len(courses)}"

        # 2. Test get_visible_course for all 9 courses
        for c in sorted(courses, key=lambda x: x.id):
            detail = course_service.get_visible_course(db, c.id, student)
            mod_count = len(detail.modules)
            lesson_count = sum(len(m.lessons) for m in detail.modules)
            first_lesson_title = detail.modules[0].lessons[0].title if detail.modules and detail.modules[0].lessons else "None"
            print(f"Course {c.id:4d} | {c.title:<42} | Mods: {mod_count:2d} | Lessons: {lesson_count:3d}")
            assert mod_count > 0, f"Course {c.title} has no modules"
            assert lesson_count > 0, f"Course {c.title} has no lessons"

        # 3. Test enrollment and progress on all 4 new courses + React
        test_course_titles = [
            "Introduction to React",
            "Introduction to Java",
            "Introduction to MongoDB",
            "Introduction to C",
            "Introduction to Python",
        ]

        for title in test_course_titles:
            course = next(c for c in courses if c.title == title)
            print(f"\n--- Testing Course: {course.title} (ID: {course.id}) ---")
            
            # Clean up if already enrolled from previous test
            existing_enr = enrollment_service.get_enrollment(db, student.id, course.id)
            if existing_enr:
                enrollment_service.unenroll_in_course(db, student.id, course.id)

            # Enroll
            enrollment = enrollment_service.enroll_in_course(db, student.id, course.id)
            print(f"  Enrolled: ID {enrollment.id}")

            # Check initial progress
            prog = progress_service.get_course_progress_summary(db, student.id, course.id)
            print(f"  Initial progress: {prog.completed_lessons}/{prog.total_lessons} (progress: {prog.progress})")
            assert prog.completed_lessons == 0

            # Mark first lesson complete
            first_l = course.modules[0].lessons[0]
            from app.schemas.learning import LessonProgressUpdate
            lp = progress_service.update_lesson_progress(
                db, student.id, first_l.id, LessonProgressUpdate(completed=True)
            )
            db.commit()
            print(f"  Marked lesson {first_l.id} complete: completed={lp.completed}")

            # Check updated progress
            prog2 = progress_service.get_course_progress_summary(db, student.id, course.id)
            print(f"  Updated progress: {prog2.completed_lessons}/{prog2.total_lessons} (progress: {prog2.progress})")
            assert prog2.completed_lessons == 1
            assert prog2.progress > 0

            # Unenroll / clean up
            enrollment_service.unenroll_in_course(db, student.id, course.id)
            print(f"  Cleaned up enrollment for {course.title}")

        print("\n=======================================================")
        print("ALL 9 COURSES AND LEARNING FLOWS VERIFIED SUCCESSFULLY!")
        print("=======================================================")

    finally:
        db.close()

if __name__ == "__main__":
    verify()
