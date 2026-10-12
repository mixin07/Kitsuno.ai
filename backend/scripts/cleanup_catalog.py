"""
Kitsuno.ai - Course Catalog Cleanup and Data Audit Script
Removes all unauthorized, test, demo, and fake courses from PostgreSQL.
Retains strictly the 9 approved canonical courses:
1. Introduction to HTML
2. Introduction to CSS
3. Introduction to JavaScript
4. Introduction to React
5. Introduction to Full-Stack Development
6. Introduction to Java
7. Introduction to MongoDB
8. Introduction to C
9. Introduction to Python
"""

import sys
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import delete, select, text
from app.database import engine, SessionLocal
from app.models import (
    AttemptAnswer,
    Course,
    Enrollment,
    ExamSession,
    ExamSessionQuestion,
    GameAttempt,
    Lesson,
    LessonProgress,
    Module,
    Option,
    Question,
    QuestionPractice,
    Quiz,
    QuizAttempt,
    SavedCourse,
    SavedLesson,
    SavedNote,
    StudyPlan,
    StudyPlanTask,
    User,
    UserCourseStatus,
    UserRole,
)

APPROVED_COURSES = [
    "Introduction to HTML",
    "Introduction to CSS",
    "Introduction to JavaScript",
    "Introduction to React",
    "Introduction to Full-Stack Development",
    "Introduction to Java",
    "Introduction to MongoDB",
    "Introduction to C",
    "Introduction to Python",
]


def clean_database():
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # 1. Audit current courses
            all_courses = conn.execute(
                text("SELECT id, title, published, instructor_id FROM courses ORDER BY id")
            ).fetchall()
            initial_count = len(all_courses)
            print(f"=== INITIAL DATABASE STATE: {initial_count} TOTAL COURSES ===")
            
            canonical_records = []
            non_canonical_records = []
            
            for c in all_courses:
                cid, title, pub, inst = c[0], c[1], c[2], c[3]
                if title in APPROVED_COURSES:
                    canonical_records.append(c)
                else:
                    non_canonical_records.append(c)
            
            print(f"Canonical courses found: {len(canonical_records)}")
            for c in canonical_records:
                print(f"  ✓ CANONICAL: [ID {c[0]:4d}] {c[1]:<42} | Published: {c[2]} | Instructor: {c[3]}")
                
            print(f"\nNon-canonical / test courses identified for removal: {len(non_canonical_records)}")
            for c in non_canonical_records:
                print(f"  ✗ REMOVE:    [ID {c[0]:4d}] {c[1]:<42} | Published: {c[2]} | Instructor: {c[3]}")
            
            if len(canonical_records) != 9:
                raise ValueError(
                    f"ABORT: Expected exactly 9 canonical courses, found {len(canonical_records)}!"
                )
            
            unauthorized_ids = [c[0] for c in non_canonical_records]
            
            if unauthorized_ids:
                print(f"\nSafely deleting dependencies for {len(unauthorized_ids)} non-canonical courses...")
                
                # A. Direct course dependencies
                r = conn.execute(
                    text("DELETE FROM user_course_statuses WHERE course_id = ANY(:cids)"),
                    {"cids": unauthorized_ids}
                )
                print(f"  - user_course_statuses: deleted {r.rowcount}")
                
                r = conn.execute(
                    text("DELETE FROM saved_courses WHERE course_id = ANY(:cids)"),
                    {"cids": unauthorized_ids}
                )
                print(f"  - saved_courses: deleted {r.rowcount}")
                
                r = conn.execute(
                    text("DELETE FROM saved_notes WHERE course_id = ANY(:cids)"),
                    {"cids": unauthorized_ids}
                )
                print(f"  - saved_notes: deleted {r.rowcount}")
                
                r = conn.execute(
                    text("DELETE FROM study_plan_tasks WHERE course_id = ANY(:cids)"),
                    {"cids": unauthorized_ids}
                )
                print(f"  - study_plan_tasks (course_id): deleted {r.rowcount}")
                
                r = conn.execute(
                    text("DELETE FROM study_plans WHERE course_id = ANY(:cids)"),
                    {"cids": unauthorized_ids}
                )
                print(f"  - study_plans: deleted {r.rowcount}")
                
                r = conn.execute(
                    text("""
                        DELETE FROM exam_session_questions
                        WHERE session_id IN (SELECT id FROM exam_sessions WHERE course_id = ANY(:cids))
                    """),
                    {"cids": unauthorized_ids}
                )
                print(f"  - exam_session_questions: deleted {r.rowcount}")
                
                r = conn.execute(
                    text("DELETE FROM exam_sessions WHERE course_id = ANY(:cids)"),
                    {"cids": unauthorized_ids}
                )
                print(f"  - exam_sessions: deleted {r.rowcount}")
                
                r = conn.execute(
                    text("DELETE FROM game_attempts WHERE course_id = ANY(:cids)"),
                    {"cids": unauthorized_ids}
                )
                print(f"  - game_attempts: deleted {r.rowcount}")
                
                r = conn.execute(
                    text("DELETE FROM enrollments WHERE course_id = ANY(:cids)"),
                    {"cids": unauthorized_ids}
                )
                print(f"  - enrollments: deleted {r.rowcount}")
                
                # B. Child modules, lessons, quizzes, questions
                mod_ids = conn.execute(
                    text("SELECT id FROM modules WHERE course_id = ANY(:cids)"),
                    {"cids": unauthorized_ids}
                ).scalars().all()
                
                if mod_ids:
                    lesson_ids = conn.execute(
                        text("SELECT id FROM lessons WHERE module_id = ANY(:mids)"),
                        {"mids": mod_ids}
                    ).scalars().all()
                    
                    if lesson_ids:
                        conn.execute(
                            text("DELETE FROM study_plan_tasks WHERE lesson_id = ANY(:lids)"),
                            {"lids": lesson_ids}
                        )
                        conn.execute(
                            text("DELETE FROM game_attempts WHERE lesson_id = ANY(:lids)"),
                            {"lids": lesson_ids}
                        )
                        conn.execute(
                            text("DELETE FROM saved_lessons WHERE lesson_id = ANY(:lids)"),
                            {"lids": lesson_ids}
                        )
                        conn.execute(
                            text("DELETE FROM saved_notes WHERE lesson_id = ANY(:lids)"),
                            {"lids": lesson_ids}
                        )
                        r = conn.execute(
                            text("DELETE FROM lesson_progress WHERE lesson_id = ANY(:lids)"),
                            {"lids": lesson_ids}
                        )
                        print(f"  - lesson_progress: deleted {r.rowcount}")
                        
                        quiz_ids = conn.execute(
                            text("SELECT id FROM quizzes WHERE lesson_id = ANY(:lids)"),
                            {"lids": lesson_ids}
                        ).scalars().all()
                        
                        if quiz_ids:
                            conn.execute(
                                text("DELETE FROM study_plan_tasks WHERE quiz_id = ANY(:qids)"),
                                {"qids": quiz_ids}
                            )
                            # Quiz attempt answers
                            r = conn.execute(
                                text("""
                                    DELETE FROM attempt_answers 
                                    WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE quiz_id = ANY(:qids))
                                """),
                                {"qids": quiz_ids}
                            )
                            print(f"  - attempt_answers: deleted {r.rowcount}")
                            
                            r = conn.execute(
                                text("DELETE FROM quiz_attempts WHERE quiz_id = ANY(:qids)"),
                                {"qids": quiz_ids}
                            )
                            print(f"  - quiz_attempts: deleted {r.rowcount}")
                            
                            # Questions & options
                            qn_ids = conn.execute(
                                text("SELECT id FROM questions WHERE quiz_id = ANY(:qids)"),
                                {"qids": quiz_ids}
                            ).scalars().all()
                            
                            if qn_ids:
                                conn.execute(
                                    text("DELETE FROM attempt_answers WHERE question_id = ANY(:qnids)"),
                                    {"qnids": qn_ids}
                                )
                                conn.execute(
                                    text("DELETE FROM question_practices WHERE question_id = ANY(:qnids)"),
                                    {"qnids": qn_ids}
                                )
                                conn.execute(
                                    text("DELETE FROM exam_session_questions WHERE question_id = ANY(:qnids)"),
                                    {"qnids": qn_ids}
                                )
                                r = conn.execute(
                                    text("DELETE FROM options WHERE question_id = ANY(:qnids)"),
                                    {"qnids": qn_ids}
                                )
                                print(f"  - options: deleted {r.rowcount}")
                                
                                r = conn.execute(
                                    text("DELETE FROM questions WHERE id = ANY(:qnids)"),
                                    {"qnids": qn_ids}
                                )
                                print(f"  - questions: deleted {r.rowcount}")
                            
                            r = conn.execute(
                                text("DELETE FROM quizzes WHERE id = ANY(:qids)"),
                                {"qids": quiz_ids}
                            )
                            print(f"  - quizzes: deleted {r.rowcount}")
                        
                        r = conn.execute(
                            text("DELETE FROM lessons WHERE id = ANY(:lids)"),
                            {"lids": lesson_ids}
                        )
                        print(f"  - lessons: deleted {r.rowcount}")
                    
                    r = conn.execute(
                        text("DELETE FROM modules WHERE id = ANY(:mids)"),
                        {"mids": mod_ids}
                    )
                    print(f"  - modules: deleted {r.rowcount}")
                
                # C. Finally delete the unauthorized courses themselves
                r = conn.execute(
                    text("DELETE FROM courses WHERE id = ANY(:cids)"),
                    {"cids": unauthorized_ids}
                )
                print(f"  - courses: deleted {r.rowcount} unauthorized course records.")
                
                # D. Also cleanup any leftover test users (@test.com)
                test_uids = conn.execute(
                    text("SELECT id FROM users WHERE email LIKE '%@test.com' OR email LIKE '%@example.com'")
                ).scalars().all()
                if test_uids:
                    conn.execute(text("DELETE FROM exam_session_questions WHERE session_id IN (SELECT id FROM exam_sessions WHERE student_id = ANY(:uids))"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM exam_sessions WHERE student_id = ANY(:uids)"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM question_practices WHERE student_id = ANY(:uids)"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM notifications WHERE user_id = ANY(:uids)"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM study_plan_tasks WHERE student_id = ANY(:uids)"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM study_plans WHERE student_id = ANY(:uids)"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM game_attempts WHERE user_id = ANY(:uids)"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM gamification_logs WHERE user_id = ANY(:uids)"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM user_quest_progress WHERE user_id = ANY(:uids)"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM user_achievements WHERE user_id = ANY(:uids)"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM user_gamification WHERE user_id = ANY(:uids)"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM user_course_statuses WHERE user_id = ANY(:uids)"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM saved_courses WHERE user_id = ANY(:uids)"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM saved_lessons WHERE user_id = ANY(:uids)"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM saved_notes WHERE user_id = ANY(:uids)"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM attempt_answers WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE student_id = ANY(:uids))"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM quiz_attempts WHERE student_id = ANY(:uids)"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM lesson_progress WHERE student_id = ANY(:uids)"), {"uids": test_uids})
                    conn.execute(text("DELETE FROM enrollments WHERE student_id = ANY(:uids)"), {"uids": test_uids})
                    r = conn.execute(text("DELETE FROM users WHERE id = ANY(:uids)"), {"uids": test_uids})
                    print(f"  - test users: cleaned {r.rowcount} orphan @test.com user accounts.")

            # 2. Verify final database state
            final_courses = conn.execute(
                text("SELECT id, title, published, instructor_id FROM courses ORDER BY id")
            ).fetchall()
            
            print(f"\n=== FINAL AUDIT RESULT: {len(final_courses)} TOTAL COURSES ===")
            for idx, c in enumerate(final_courses, 1):
                cid = c[0]
                mods = conn.execute(text("SELECT count(*) FROM modules WHERE course_id = :cid"), {"cid": cid}).scalar()
                lessons = conn.execute(text("SELECT count(*) FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = :cid"), {"cid": cid}).scalar()
                quizzes = conn.execute(text("SELECT count(*) FROM quizzes q JOIN lessons l ON q.lesson_id = l.id JOIN modules m ON l.module_id = m.id WHERE m.course_id = :cid"), {"cid": cid}).scalar()
                print(f"  {idx}. [ID {cid:4d}] {c[1]:<42} | Mods: {mods:2d} | Lessons: {lessons:3d} | Quizzes: {quizzes:2d} | Published: {c[2]}")
            
            # Assertions
            assert len(final_courses) == 9, f"ERROR: Expected 9 courses, but found {len(final_courses)}"
            for c in final_courses:
                assert c[1] in APPROVED_COURSES, f"ERROR: Non-canonical course remained: {c[1]}"
                assert c[2] is True, f"ERROR: Course {c[1]} is not published"
            
            # Curriculum integrity check
            total_mods = conn.execute(text("SELECT count(*) FROM modules")).scalar()
            total_lessons = conn.execute(text("SELECT count(*) FROM lessons")).scalar()
            total_quizzes = conn.execute(text("SELECT count(*) FROM quizzes")).scalar()
            total_questions = conn.execute(text("SELECT count(*) FROM questions")).scalar()
            
            print(f"\nCurriculum Totals:")
            print(f"  Total Modules:   {total_mods} (Expected: 28)")
            print(f"  Total Lessons:   {total_lessons} (Expected: 476)")
            print(f"  Total Quizzes:   {total_quizzes} (Expected: 36)")
            print(f"  Total Questions: {total_questions} (Expected: 180)")
            
            assert total_mods == 28, f"Curriculum mismatch: expected 28 modules, got {total_mods}"
            assert total_lessons == 476, f"Curriculum mismatch: expected 476 lessons, got {total_lessons}"
            assert total_quizzes == 36, f"Curriculum mismatch: expected 36 quizzes, got {total_quizzes}"
            assert total_questions == 180, f"Curriculum mismatch: expected 180 questions, got {total_questions}"
            
            # Commit the transaction
            trans.commit()
            print("\n✓ SUCCESS: Database cleanup committed successfully!")
            
            return {
                "initial_count": initial_count,
                "removed_count": len(unauthorized_ids),
                "final_count": len(final_courses),
                "final_courses": [c[1] for c in final_courses],
            }
        except Exception as e:
            trans.rollback()
            print("\n✗ FAILED: Cleanup transaction rolled back due to error:", e)
            raise e


if __name__ == "__main__":
    clean_database()
