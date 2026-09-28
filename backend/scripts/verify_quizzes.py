"""
Comprehensive End-to-End Quiz Verification Script.
Validates:
1. Database Quiz Statistics (counts, distribution, options, correct answers)
2. Security & Information Hiding (is_correct hidden before submission, attempt isolation)
3. End-to-End Student Flow (enroll -> fetch quiz -> start attempt -> submit -> score -> review -> progress -> retry)
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app.models import Course, Module, Lesson, Quiz, Question, Option, QuizAttempt, AttemptAnswer, User, UserRole
from app.services import course_service, enrollment_service, quiz_service, progress_service
from app.schemas.quiz import AttemptSubmitPayload, AnswerSubmission

def verify_all_quizzes():
    db = SessionLocal()
    try:
        print("=======================================================")
        print("1. DATABASE QUIZ INTEGRITY & METRICS AUDIT")
        print("=======================================================")

        courses = db.query(Course).order_by(Course.id).all()
        total_quizzes = db.query(Quiz).count()
        total_questions = db.query(Question).count()
        total_options = db.query(Option).count()

        print(f"Total Quizzes in DB:   {total_quizzes}")
        print(f"Total Questions in DB: {total_questions}")
        print(f"Total Options in DB:   {total_options}")

        assert total_quizzes == 36, f"Expected 36 quizzes, got {total_quizzes}"
        assert total_questions == 180, f"Expected 180 questions, got {total_questions}"
        assert total_options == 720, f"Expected 720 options, got {total_options}"

        # Check each course's quiz distribution
        course_quiz_counts = {}
        for c in courses:
            c_quizzes = (
                db.query(Quiz)
                .join(Lesson, Quiz.lesson_id == Lesson.id)
                .join(Module, Lesson.module_id == Module.id)
                .filter(Module.course_id == c.id)
                .all()
            )
            c_questions = sum(len(q.questions) for q in c_quizzes)
            course_quiz_counts[c.title] = len(c_quizzes)
            print(f"Course: {c.title:<42} | Quizzes: {len(c_quizzes)} | Questions: {c_questions}")
            assert len(c_quizzes) > 0, f"Course {c.title} has no quizzes!"

        # Check option integrity for EVERY question in the database
        questions = db.query(Question).all()
        for q in questions:
            assert len(q.options) == 4, f"Question {q.id} has {len(q.options)} options instead of 4"
            correct_opts = [o for o in q.options if o.is_correct]
            assert len(correct_opts) == 1, f"Question {q.id} has {len(correct_opts)} correct options instead of exactly 1"

        print("\nAll 180 questions have exactly 4 options and exactly 1 correct answer!")

        print("\n=======================================================")
        print("2. SECURITY & INFORMATION HIDING CHECKS")
        print("=======================================================")

        # Pick student user
        student = db.query(User).filter(User.role == UserRole.STUDENT).first()
        student2 = db.query(User).filter(User.role == UserRole.STUDENT, User.id != student.id).first()
        if not student2:
            student2 = User(
                name="Security Test Student",
                email="sectest@kitsuno.ai",
                password_hash="test",
                role=UserRole.STUDENT,
            )
            db.add(student2)
            db.commit()
            db.refresh(student2)

        # Pick a quiz from Python course
        py_course = db.query(Course).filter(Course.title == "Introduction to Python").first()
        py_quiz = (
            db.query(Quiz)
            .join(Lesson, Quiz.lesson_id == Lesson.id)
            .join(Module, Lesson.module_id == Module.id)
            .filter(Module.course_id == py_course.id)
            .first()
        )

        # Enroll student in Python course
        enr = enrollment_service.get_enrollment(db, student.id, py_course.id)
        if not enr:
            enrollment_service.enroll_in_course(db, student.id, py_course.id)

        # Call get_quiz_for_take and verify options do not expose is_correct
        quiz_take = quiz_service.get_quiz_for_take(db, student.id, py_quiz.id)
        print(f"Quiz Take Response for '{quiz_take.title}':")
        print(f"  Questions Count: {len(quiz_take.questions)}")
        print(f"  Total Points:    {quiz_take.total_points}")
        for q in quiz_take.questions:
            for opt in q.options:
                assert not hasattr(opt, "is_correct"), f"Security Leak: option exposed is_correct attribute!"

        print("Confirmed: Options payload completely hides correctness before submission.")

        print("\n=======================================================")
        print("3. END-TO-END LEARNING & ATTEMPT FLOW")
        print("=======================================================")

        # Step A: Start attempt
        attempt = quiz_service.start_attempt(db, student.id, py_quiz.id)
        print(f"  Attempt started: ID {attempt.id}, score: {attempt.score}, total_points: {attempt.total_points}")
        assert attempt.score == 0.0
        assert attempt.completed_at is None

        # Step B: Submit partial answers (3 correct, 2 incorrect)
        raw_questions = py_quiz.questions
        submission_answers = []
        for i, q in enumerate(raw_questions):
            if i < 3:
                # Correct option
                corr = next(o for o in q.options if o.is_correct)
                submission_answers.append(AnswerSubmission(question_id=q.id, selected_option_id=corr.id))
            else:
                # Incorrect option
                wrong = next(o for o in q.options if not o.is_correct)
                submission_answers.append(AnswerSubmission(question_id=q.id, selected_option_id=wrong.id))

        submitted_attempt = quiz_service.submit_attempt(
            db, student.id, attempt.id, AttemptSubmitPayload(answers=submission_answers)
        )
        print(f"  Attempt submitted: score={submitted_attempt.score}/{submitted_attempt.total_points} ({submitted_attempt.percentage}%)")
        assert submitted_attempt.score == 3.0
        assert submitted_attempt.percentage == 60.0
        assert submitted_attempt.completed_at is not None

        # Step C: Verify attempt detail view with review data
        detail = quiz_service.build_attempt_detail(submitted_attempt)
        print(f"  Attempt Detail: quiz_title='{detail.quiz_title}', answers_count={len(detail.answers)}")
        assert detail.quiz_title == py_quiz.title
        assert len(detail.answers) == 5

        # Verify correct_option_text is available on review
        for ans in detail.answers:
            print(f"    Q (ID {ans.question_id}): is_correct={ans.is_correct} | Selected: '{ans.selected_option_text}' | Correct Option: '{ans.correct_option_text}'")
            assert ans.correct_option_text is not None

        # Step D: Security isolation - Student 2 cannot access Student 1's attempt
        from fastapi import HTTPException
        try:
            quiz_service.get_attempt(db, student2.id, submitted_attempt.id)
            assert False, "Security violation: Student 2 accessed Student 1's attempt!"
        except HTTPException as e:
            assert e.status_code == 404
            print("Confirmed: Student attempt ownership isolation enforced (404 on cross-student access).")

        # Step E: Verify Lesson Progress was updated on passing quiz (>= 60%)
        l_prog = progress_service.get_lesson_progress(db, student.id, py_quiz.lesson_id)
        print(f"  Lesson Progress for lesson {py_quiz.lesson_id}: completed={l_prog.completed}")
        assert l_prog.completed is True

        # Step F: Retake quiz flow - Start new attempt and score 100%
        attempt2 = quiz_service.start_attempt(db, student.id, py_quiz.id)
        all_correct_answers = [
            AnswerSubmission(question_id=q.id, selected_option_id=next(o.id for o in q.options if o.is_correct))
            for q in raw_questions
        ]
        submitted_attempt2 = quiz_service.submit_attempt(
            db, student.id, attempt2.id, AttemptSubmitPayload(answers=all_correct_answers)
        )
        print(f"  Retake Attempt: score={submitted_attempt2.score}/{submitted_attempt2.total_points} ({submitted_attempt2.percentage}%)")
        assert submitted_attempt2.percentage == 100.0

        # Step G: Clean up test attempts
        db.delete(submitted_attempt)
        db.delete(submitted_attempt2)
        enrollment_service.unenroll_in_course(db, student.id, py_course.id)
        db.commit()
        print("  Test attempts and enrollment cleaned up cleanly.")

        print("\n=======================================================")
        print("ALL QUIZ VERIFICATIONS PASSED SUCCESSFULLY!")
        print("=======================================================")

    finally:
        db.close()

if __name__ == "__main__":
    verify_all_quizzes()
