import uuid

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.security import hash_password
from app.database import SessionLocal
from app.main import app
from app.models import (
    AttemptAnswer,
    Option,
    Question,
    Quiz,
    QuizAttempt,
    User,
    UserRole,
)

client = TestClient(app)

BASE = "/api/v1"
PASSWORD = "TestPassword123!"


def _auth_header(user: User) -> dict[str, str]:
    response = client.post(
        f"{BASE}/auth/login", json={"email": user.email, "password": PASSWORD}
    )
    assert response.status_code == 200, "test login failed"
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _seed_student(name: str = "Quiz Student") -> User:
    db = SessionLocal()
    try:
        user = User(
            name=name,
            email=f"quiz_{uuid.uuid4().hex[:8]}@test.com",
            password_hash=hash_password(PASSWORD),
            role=UserRole.STUDENT,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def _create_course(user: User, **overrides) -> dict:
    payload = {"title": "Quiz Course", **overrides}
    response = client.post(f"{BASE}/courses", json=payload, headers=_auth_header(user))
    assert response.status_code == 201, response.text
    return response.json()


def _create_module(user: User, course_id: int, title: str = "Module") -> dict:
    response = client.post(
        f"{BASE}/courses/{course_id}/modules",
        json={"title": title},
        headers=_auth_header(user),
    )
    assert response.status_code == 201, response.text
    return response.json()


def _create_lesson(user: User, course_id: int, module_id: int, order: int) -> dict:
    response = client.post(
        f"{BASE}/courses/{course_id}/modules/{module_id}/lessons",
        json={"title": f"Lesson {order}", "order_number": order, "content": "lesson body"},
        headers=_auth_header(user),
    )
    assert response.status_code == 201, response.text
    return response.json()


def _published_course(inst_a: User) -> tuple[int, int]:
    course = _create_course(inst_a)
    module = _create_module(inst_a, course["id"])
    lesson = _create_lesson(inst_a, course["id"], module["id"], order=1)
    publish = client.post(
        f"{BASE}/courses/{course['id']}/publish", headers=_auth_header(inst_a)
    )
    assert publish.status_code == 200, publish.text
    return course["id"], lesson["id"]


def _seed_quiz(lesson_id: int) -> tuple[dict, list[int], list[list[int]]]:
    db = SessionLocal()
    try:
        quiz = Quiz(lesson_id=lesson_id, title="Lesson Quiz", description="auto quiz")
        db.add(quiz)
        db.flush()
        specs = [
            ("What is 2 + 2?", 2, [("3", False), ("4", True), ("5", False)]),
            ("What is the capital of France?", 3, [("Paris", True), ("Lyon", False)]),
        ]
        question_ids: list[int] = []
        option_ids: list[list[int]] = []
        for qi, (text, points, options) in enumerate(specs, start=1):
            question = Question(
                quiz_id=quiz.id, question_text=text, points=points, order_index=qi
            )
            db.add(question)
            db.flush()
            q_option_ids: list[int] = []
            for oi, (text, correct) in enumerate(options, start=1):
                option = Option(
                    question_id=question.id,
                    option_text=text,
                    is_correct=correct,
                    order_index=oi,
                )
                db.add(option)
                db.flush()
                q_option_ids.append(option.id)
            question_ids.append(question.id)
            option_ids.append(q_option_ids)
        db.commit()
        return {"id": quiz.id}, question_ids, option_ids
    finally:
        db.close()


def _enroll(student: User, course_id: int) -> None:
    response = client.post(
        f"{BASE}/enrollments/{course_id}", headers=_auth_header(student)
    )
    assert response.status_code == 201, response.text


def _start_attempt(student: User, quiz_id: int) -> dict:
    response = client.post(
        f"{BASE}/quizzes/{quiz_id}/attempts", headers=_auth_header(student)
    )
    assert response.status_code == 201, response.text
    return response.json()


def _submit(student: User, attempt_id: int, answers: list[dict]) -> dict:
    response = client.post(
        f"{BASE}/attempts/{attempt_id}/submit",
        json={"answers": answers},
        headers=_auth_header(student),
    )
    assert response.status_code == 200, response.text
    return response.json()


# --------------------------------------------------------------------------
# Access control
# --------------------------------------------------------------------------


def test_quiz_endpoints_require_authentication(inst_a: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, _, _ = _seed_quiz(lesson_id)
    assert client.get(f"{BASE}/quizzes/{quiz['id']}").status_code == 401
    assert client.post(f"{BASE}/quizzes/{quiz['id']}/attempts").status_code == 401
    assert client.get(f"{BASE}/quizzes/{quiz['id']}/attempts").status_code == 401
    assert client.get(f"{BASE}/attempts/1").status_code == 401
    assert client.post(f"{BASE}/attempts/1/submit", json={"answers": []}).status_code == 401


def test_instructor_cannot_access_quiz(inst_a: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, _, _ = _seed_quiz(lesson_id)
    headers = _auth_header(inst_a)
    assert client.get(f"{BASE}/quizzes/{quiz['id']}", headers=headers).status_code == 403
    assert client.post(
        f"{BASE}/quizzes/{quiz['id']}/attempts", headers=headers
    ).status_code == 403


def test_non_enrolled_student_cannot_access_quiz(inst_a: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, _, _ = _seed_quiz(lesson_id)
    outsider = _seed_student("Outsider Quiz")
    headers = _auth_header(outsider)
    assert client.get(f"{BASE}/quizzes/{quiz['id']}", headers=headers).status_code == 403
    assert client.post(
        f"{BASE}/quizzes/{quiz['id']}/attempts", headers=headers
    ).status_code == 403
    assert client.get(
        f"{BASE}/quizzes/{quiz['id']}/attempts", headers=headers
    ).status_code == 403


def test_missing_quiz_is_404(student: User) -> None:
    assert client.get(f"{BASE}/quizzes/999999", headers=_auth_header(student)).status_code == 404
    assert client.post(
        f"{BASE}/quizzes/999999/attempts", headers=_auth_header(student)
    ).status_code == 404


def test_quiz_in_unpublished_course_is_404(inst_a: User, student: User) -> None:
    course = _create_course(inst_a)
    module = _create_module(inst_a, course["id"])
    lesson = _create_lesson(inst_a, course["id"], module["id"], order=1)
    quiz, _, _ = _seed_quiz(lesson["id"])
    assert client.get(f"{BASE}/quizzes/{quiz['id']}", headers=_auth_header(student)).status_code == 404


def test_enrolled_student_can_take_quiz(inst_a: User, student: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, question_ids, option_ids = _seed_quiz(lesson_id)
    _enroll(student, course_id)

    response = client.get(f"{BASE}/quizzes/{quiz['id']}", headers=_auth_header(student))
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == quiz["id"]
    assert body["lesson_id"] == lesson_id
    assert body["total_points"] == 5
    assert len(body["questions"]) == 2
    first = body["questions"][0]
    assert first["id"] == question_ids[0]
    assert first["points"] == 2
    assert len(first["options"]) == 3
    assert first["options"][1]["option_text"] == "4"


def test_quiz_take_does_not_expose_correctness(inst_a: User, student: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, _, _ = _seed_quiz(lesson_id)
    _enroll(student, course_id)

    body = client.get(f"{BASE}/quizzes/{quiz['id']}", headers=_auth_header(student)).json()
    for question in body["questions"]:
        for option in question["options"]:
            assert "is_correct" not in option
            assert "correct" not in option


# --------------------------------------------------------------------------
# Attempts
# --------------------------------------------------------------------------


def test_start_attempt_initializes_zero(inst_a: User, student: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, _, _ = _seed_quiz(lesson_id)
    _enroll(student, course_id)

    attempt = _start_attempt(student, quiz["id"])
    assert attempt["student_id"] == student.id
    assert attempt["quiz_id"] == quiz["id"]
    assert attempt["score"] == 0.0
    assert attempt["total_points"] == 5.0
    assert attempt["percentage"] == 0.0
    assert attempt["completed_at"] is None


def test_start_attempt_persists(inst_a: User, student: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, _, _ = _seed_quiz(lesson_id)
    _enroll(student, course_id)
    attempt = _start_attempt(student, quiz["id"])

    db = SessionLocal()
    try:
        row = db.scalar(select(QuizAttempt).where(QuizAttempt.id == attempt["id"]))
        assert row is not None
        assert row.student_id == student.id
        assert row.quiz_id == quiz["id"]
        assert row.total_points == 5.0
    finally:
        db.close()


def test_submit_all_correct_scores_full(inst_a: User, student: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, question_ids, option_ids = _seed_quiz(lesson_id)
    _enroll(student, course_id)
    attempt = _start_attempt(student, quiz["id"])

    result = _submit(
        student,
        attempt["id"],
        [
            {"question_id": question_ids[0], "selected_option_id": option_ids[0][1]},
            {"question_id": question_ids[1], "selected_option_id": option_ids[1][0]},
        ],
    )
    assert result["score"] == 5.0
    assert result["total_points"] == 5.0
    assert result["percentage"] == 100.0
    assert result["completed_at"] is not None
    assert len(result["answers"]) == 2
    assert all(answer["is_correct"] for answer in result["answers"])
    assert result["quiz_title"] == "Lesson Quiz"
    assert result["lesson_id"] == lesson_id


def test_submit_partial_scores(inst_a: User, student: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, question_ids, option_ids = _seed_quiz(lesson_id)
    _enroll(student, course_id)
    attempt = _start_attempt(student, quiz["id"])

    result = _submit(
        student,
        attempt["id"],
        [
            {"question_id": question_ids[1], "selected_option_id": option_ids[1][0]},
        ],
    )
    assert result["score"] == 3.0
    assert result["total_points"] == 5.0
    assert result["percentage"] == 60.0
    assert len(result["answers"]) == 2
    by_question = {answer["question_id"]: answer for answer in result["answers"]}
    assert by_question[question_ids[0]]["is_correct"] is False
    assert by_question[question_ids[0]]["points_earned"] == 0.0
    assert by_question[question_ids[1]]["is_correct"] is True
    assert by_question[question_ids[1]]["points_earned"] == 3.0


def test_submit_all_wrong_scores_zero(inst_a: User, student: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, question_ids, option_ids = _seed_quiz(lesson_id)
    _enroll(student, course_id)
    attempt = _start_attempt(student, quiz["id"])

    result = _submit(
        student,
        attempt["id"],
        [
            {"question_id": question_ids[0], "selected_option_id": option_ids[0][0]},
            {"question_id": question_ids[1], "selected_option_id": option_ids[1][1]},
        ],
    )
    assert result["score"] == 0.0
    assert result["percentage"] == 0.0


def test_submit_empty_answers_scores_zero(inst_a: User, student: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, _, _ = _seed_quiz(lesson_id)
    _enroll(student, course_id)
    attempt = _start_attempt(student, quiz["id"])

    result = _submit(student, attempt["id"], [])
    assert result["score"] == 0.0
    assert result["percentage"] == 0.0
    assert len(result["answers"]) == 2
    assert all(not answer["is_correct"] for answer in result["answers"])
    assert all(answer["selected_option_id"] is None for answer in result["answers"])


def test_invalid_question_id_rejected(inst_a: User, student: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, question_ids, option_ids = _seed_quiz(lesson_id)
    _enroll(student, course_id)
    attempt = _start_attempt(student, quiz["id"])

    response = client.post(
        f"{BASE}/attempts/{attempt['id']}/submit",
        json={"answers": [{"question_id": 999999, "selected_option_id": option_ids[0][1]}]},
        headers=_auth_header(student),
    )
    assert response.status_code == 422


def test_question_from_other_quiz_rejected(inst_a: User, student: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, _, _ = _seed_quiz(lesson_id)
    _, other_lesson_id = _published_course(inst_a)
    other, other_ids, other_options = _seed_quiz(other_lesson_id)
    _enroll(student, course_id)
    attempt = _start_attempt(student, quiz["id"])

    response = client.post(
        f"{BASE}/attempts/{attempt['id']}/submit",
        json={
            "answers": [
                {"question_id": other_ids[0], "selected_option_id": other_options[0][1]}
            ]
        },
        headers=_auth_header(student),
    )
    assert response.status_code == 422


def test_invalid_option_id_rejected(inst_a: User, student: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, question_ids, _ = _seed_quiz(lesson_id)
    _enroll(student, course_id)
    attempt = _start_attempt(student, quiz["id"])

    response = client.post(
        f"{BASE}/attempts/{attempt['id']}/submit",
        json={"answers": [{"question_id": question_ids[0], "selected_option_id": 999999}]},
        headers=_auth_header(student),
    )
    assert response.status_code == 422


def test_option_of_other_question_rejected(inst_a: User, student: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, question_ids, option_ids = _seed_quiz(lesson_id)
    _enroll(student, course_id)
    attempt = _start_attempt(student, quiz["id"])
    other_question_option = option_ids[1][0]

    response = client.post(
        f"{BASE}/attempts/{attempt['id']}/submit",
        json={
            "answers": [
                {
                    "question_id": question_ids[0],
                    "selected_option_id": other_question_option,
                }
            ]
        },
        headers=_auth_header(student),
    )
    assert response.status_code == 422


def test_completed_attempt_rejects_resubmission(inst_a: User, student: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, question_ids, option_ids = _seed_quiz(lesson_id)
    _enroll(student, course_id)
    attempt = _start_attempt(student, quiz["id"])

    first = _submit(student, attempt["id"], [])
    assert first["completed_at"] is not None

    second = client.post(
        f"{BASE}/attempts/{attempt['id']}/submit",
        json={"answers": []},
        headers=_auth_header(student),
    )
    assert second.status_code == 409


def test_client_controlled_score_and_correctness_rejected(
    inst_a: User, student: User
) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, question_ids, option_ids = _seed_quiz(lesson_id)
    _enroll(student, course_id)
    attempt = _start_attempt(student, quiz["id"])

    response = client.post(
        f"{BASE}/attempts/{attempt['id']}/submit",
        json={
            "answers": [
                {"question_id": question_ids[0], "selected_option_id": option_ids[0][1]}
            ],
            "score": 0,
            "is_correct": False,
        },
        headers=_auth_header(student),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["score"] == 2.0
    assert body["percentage"] == 40.0
    assert body["answers"][0]["is_correct"] is True


def test_attempt_visible_only_to_owner(inst_a: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, question_ids, option_ids = _seed_quiz(lesson_id)
    owner = _seed_student("Attempt Owner")
    stranger = _seed_student("Attempt Stranger")
    _enroll(owner, course_id)
    _enroll(stranger, course_id)

    attempt = _start_attempt(owner, quiz["id"])
    _submit(owner, attempt["id"], [])
    assert client.get(
        f"{BASE}/attempts/{attempt['id']}", headers=_auth_header(owner)
    ).status_code == 200
    assert client.get(
        f"{BASE}/attempts/{attempt['id']}", headers=_auth_header(stranger)
    ).status_code == 404


def test_attempt_listing_isolated_between_students(inst_a: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, question_ids, option_ids = _seed_quiz(lesson_id)
    student_a = _seed_student("List A")
    student_b = _seed_student("List B")
    _enroll(student_a, course_id)
    _enroll(student_b, course_id)

    _start_attempt(student_a, quiz["id"])
    attempt_b = _start_attempt(student_b, quiz["id"])

    list_a = client.get(
        f"{BASE}/quizzes/{quiz['id']}/attempts", headers=_auth_header(student_a)
    ).json()
    list_b = client.get(
        f"{BASE}/quizzes/{quiz['id']}/attempts", headers=_auth_header(student_b)
    ).json()
    assert len(list_a) == 1
    assert list_a[0]["student_id"] == student_a.id
    assert len(list_b) == 1
    assert list_b[0]["id"] == attempt_b["id"]


def test_attempt_detail_includes_answer_context(inst_a: User, student: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, question_ids, option_ids = _seed_quiz(lesson_id)
    _enroll(student, course_id)
    attempt = _start_attempt(student, quiz["id"])
    _submit(student, attempt["id"], [{"question_id": question_ids[0], "selected_option_id": option_ids[0][1]}])

    detail = client.get(
        f"{BASE}/attempts/{attempt['id']}", headers=_auth_header(student)
    )
    assert detail.status_code == 200
    body = detail.json()
    assert body["quiz_title"] == "Lesson Quiz"
    assert len(body["answers"]) == 2


# --------------------------------------------------------------------------
# Data integrity
# --------------------------------------------------------------------------


def test_quiz_belongs_to_lesson_and_course(inst_a: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, _, _ = _seed_quiz(lesson_id)

    db = SessionLocal()
    try:
        row = db.scalar(select(Quiz).where(Quiz.id == quiz["id"]))
        assert row is not None
        assert row.lesson_id == lesson_id
        assert row.lesson.module.course_id == course_id
        assert db.scalar(select(Question).where(Question.quiz_id == quiz["id"])) is not None
        option = db.scalar(select(Option).where(Option.question_id == row.questions[0].id))
        assert option is not None
    finally:
        db.close()


def test_cascade_delete_cleans_quiz_tree(inst_a: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, question_ids, option_ids = _seed_quiz(lesson_id)
    student = _seed_student("Cascade Student")
    _enroll(student, course_id)
    attempt = _start_attempt(student, quiz["id"])
    _submit(student, attempt["id"], [{"question_id": question_ids[0], "selected_option_id": option_ids[0][1]}])

    db = SessionLocal()
    try:
        lesson = db.scalar(select(Question).where(Question.id == question_ids[0])).quiz.lesson
        course = lesson.module.course
        db.delete(course)
        db.commit()
        assert db.scalar(select(Quiz).where(Quiz.id == quiz["id"])) is None
        assert db.scalar(select(Question).where(Question.id == question_ids[0])) is None
        assert db.scalar(select(Option).where(Option.id == option_ids[0][1])) is None
        assert db.scalar(select(QuizAttempt).where(QuizAttempt.id == attempt["id"])) is None
        assert db.scalar(select(AttemptAnswer).where(AttemptAnswer.attempt_id == attempt["id"])) is None
    finally:
        db.close()


def test_quiz_relationships_exercise_backrefs(inst_a: User, student: User) -> None:
    course_id, lesson_id = _published_course(inst_a)
    quiz, _, _ = _seed_quiz(lesson_id)
    _enroll(student, course_id)
    attempt = _start_attempt(student, quiz["id"])

    db = SessionLocal()
    try:
        row = db.scalar(select(QuizAttempt).where(QuizAttempt.id == attempt["id"]))
        assert row.quiz.lesson.title == "Lesson 1"
        assert row.student.id == student.id
    finally:
        db.close()