import json
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.security import hash_password
from app.database import SessionLocal
from app.main import app
from app.models import Lesson, Option, Question, Quiz, User, UserRole
from app.services import ai_question_service

client = TestClient(app)

BASE = "/api/v1"
PASSWORD = "TestPassword123!"
GENERATE_URL = f"{BASE}/ai/quizzes/generate"
SAVE_URL = f"{BASE}/ai/quizzes/save"


class FakeProvider:
    def __init__(self, text: str):
        self.text = text

    def generate(self, prompt: str, count: int) -> str:
        return self.text


def valid_json(count: int = 5) -> str:
    questions = []
    for i in range(1, count + 1):
        questions.append(
            {
                "question_text": f"Generated question {i}?",
                "question_type": "MCQ",
                "points": 1,
                "options": [
                    {"option_text": f"Correct {i}", "is_correct": True},
                    {"option_text": f"Wrong A {i}", "is_correct": False},
                    {"option_text": f"Wrong B {i}", "is_correct": False},
                    {"option_text": f"Wrong C {i}", "is_correct": False},
                ],
            }
        )
    return json.dumps({"questions": questions})


def _auth_header(user: User) -> dict[str, str]:
    response = client.post(
        f"{BASE}/auth/login", json={"email": user.email, "password": PASSWORD}
    )
    assert response.status_code == 200, "test login failed"
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _stub_provider(monkeypatch: pytest.MonkeyPatch, text: str) -> None:
    monkeypatch.setattr(ai_question_service, "get_ai_provider", lambda: FakeProvider(text))


def _create_lesson(inst_a: User) -> dict:
    response = client.post(
        f"{BASE}/courses", json={"title": "AI Quiz Course"}, headers=_auth_header(inst_a)
    )
    assert response.status_code == 201, response.text
    course = response.json()
    response = client.post(
        f"{BASE}/courses/{course['id']}/modules",
        json={"title": "Module"},
        headers=_auth_header(inst_a),
    )
    assert response.status_code == 201, response.text
    module = response.json()
    response = client.post(
        f"{BASE}/courses/{course['id']}/modules/{module['id']}/lessons",
        json={"title": "Lesson", "order_number": 1, "content": "lesson body"},
        headers=_auth_header(inst_a),
    )
    assert response.status_code == 201, response.text
    lesson = response.json()
    return {"course_id": course["id"], "module_id": module["id"], "lesson_id": lesson["id"]}


def generate_payload(lesson_id: int, **overrides) -> dict:
    payload = {
        "lesson_id": lesson_id,
        "topic": "Newtonian mechanics",
        "number_of_questions": 3,
        "difficulty": "MEDIUM",
        "question_type": "MCQ",
    }
    payload.update(overrides)
    return payload


# --------------------------------------------------------------------------
# Authorization
# --------------------------------------------------------------------------


def test_ai_generate_requires_authentication(monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_provider(monkeypatch, valid_json())
    assert client.post(GENERATE_URL, json=generate_payload(1)).status_code == 401
    assert client.post(SAVE_URL, json={"lesson_id": 1, "questions": []}).status_code == 401


def test_ai_student_forbidden(inst_a: User, student: User, monkeypatch: pytest.MonkeyPatch) -> None:
    lesson = _create_lesson(inst_a)
    _stub_provider(monkeypatch, valid_json())
    headers = _auth_header(student)
    assert client.post(GENERATE_URL, json=generate_payload(lesson["lesson_id"]), headers=headers).status_code == 403
    assert client.post(SAVE_URL, json={"lesson_id": lesson["lesson_id"], "questions": []}, headers=headers).status_code == 403


def test_ai_unauthorized_instructor_forbidden(
    inst_a: User, inst_b: User, monkeypatch: pytest.MonkeyPatch
) -> None:
    lesson = _create_lesson(inst_a)
    _stub_provider(monkeypatch, valid_json())
    headers = _auth_header(inst_b)
    assert client.post(GENERATE_URL, json=generate_payload(lesson["lesson_id"]), headers=headers).status_code == 403
    assert client.post(SAVE_URL, json={"lesson_id": lesson["lesson_id"], "questions": approved_questions(1)}, headers=headers).status_code == 403


def test_ai_admin_allowed(inst_a: User, admin: User, monkeypatch: pytest.MonkeyPatch) -> None:
    lesson = _create_lesson(inst_a)
    _stub_provider(monkeypatch, valid_json(1))
    headers = _auth_header(admin)
    response = client.post(
        GENERATE_URL, json=generate_payload(lesson["lesson_id"], number_of_questions=1), headers=headers
    )
    assert response.status_code == 200, response.text


def test_ai_invalid_lesson_404(inst_a: User, monkeypatch: pytest.MonkeyPatch) -> None:
    _stub_provider(monkeypatch, valid_json())
    headers = _auth_header(inst_a)
    assert client.post(GENERATE_URL, json=generate_payload(999999), headers=headers).status_code == 404
    assert client.post(SAVE_URL, json={"lesson_id": 999999, "questions": approved_questions(1)}, headers=headers).status_code == 404


# --------------------------------------------------------------------------
# Request validation
# --------------------------------------------------------------------------


def test_ai_invalid_number_of_questions_422(inst_a: User, monkeypatch: pytest.MonkeyPatch) -> None:
    lesson = _create_lesson(inst_a)
    _stub_provider(monkeypatch, valid_json())
    headers = _auth_header(inst_a)
    assert client.post(
        GENERATE_URL, json=generate_payload(lesson["lesson_id"], number_of_questions=0), headers=headers
    ).status_code == 422
    assert client.post(
        GENERATE_URL, json=generate_payload(lesson["lesson_id"], number_of_questions=21), headers=headers
    ).status_code == 422


def test_ai_empty_topic_422(inst_a: User, monkeypatch: pytest.MonkeyPatch) -> None:
    lesson = _create_lesson(inst_a)
    _stub_provider(monkeypatch, valid_json())
    headers = _auth_header(inst_a)
    assert client.post(
        GENERATE_URL, json=generate_payload(lesson["lesson_id"], topic=""), headers=headers
    ).status_code == 422
    assert client.post(
        GENERATE_URL, json=generate_payload(lesson["lesson_id"], topic="ab"), headers=headers
    ).status_code == 422


def test_ai_invalid_difficulty_422(inst_a: User, monkeypatch: pytest.MonkeyPatch) -> None:
    lesson = _create_lesson(inst_a)
    _stub_provider(monkeypatch, valid_json())
    assert client.post(
        GENERATE_URL,
        json=generate_payload(lesson["lesson_id"], difficulty="IMPOSSIBLE"),
        headers=_auth_header(inst_a),
    ).status_code == 422


def test_ai_invalid_question_type_422(inst_a: User, monkeypatch: pytest.MonkeyPatch) -> None:
    lesson = _create_lesson(inst_a)
    _stub_provider(monkeypatch, valid_json())
    assert client.post(
        GENERATE_URL,
        json=generate_payload(lesson["lesson_id"], question_type="ESSAY"),
        headers=_auth_header(inst_a),
    ).status_code == 422


# --------------------------------------------------------------------------
# AI response handling
# --------------------------------------------------------------------------


def test_ai_malformed_response_502(inst_a: User, monkeypatch: pytest.MonkeyPatch) -> None:
    lesson = _create_lesson(inst_a)
    _stub_provider(monkeypatch, "this is not json")
    response = client.post(
        GENERATE_URL, json=generate_payload(lesson["lesson_id"]), headers=_auth_header(inst_a)
    )
    assert response.status_code == 502


def test_ai_response_wrong_shape_502(inst_a: User, monkeypatch: pytest.MonkeyPatch) -> None:
    lesson = _create_lesson(inst_a)
    _stub_provider(monkeypatch, json.dumps({"foo": "bar"}))
    assert client.post(
        GENERATE_URL, json=generate_payload(lesson["lesson_id"]), headers=_auth_header(inst_a)
    ).status_code == 502
    _stub_provider(monkeypatch, json.dumps({"questions": "not-a-list"}))
    assert client.post(
        GENERATE_URL, json=generate_payload(lesson["lesson_id"]), headers=_auth_header(inst_a)
    ).status_code == 502


def test_ai_response_invalid_question_structure_502(
    inst_a: User, monkeypatch: pytest.MonkeyPatch
) -> None:
    lesson = _create_lesson(inst_a)
    bad = json.dumps(
        {
            "questions": [
                {
                    "question_text": "Which is right?",
                    "question_type": "MCQ",
                    "points": 1,
                    "options": [
                        {"option_text": "A", "is_correct": True},
                        {"option_text": "B", "is_correct": True},
                    ],
                }
            ]
        }
    )
    _stub_provider(monkeypatch, bad)
    assert client.post(
        GENERATE_URL, json=generate_payload(lesson["lesson_id"], number_of_questions=1), headers=_auth_header(inst_a)
    ).status_code == 502


def test_ai_valid_response_200(inst_a: User, monkeypatch: pytest.MonkeyPatch) -> None:
    lesson = _create_lesson(inst_a)
    _stub_provider(monkeypatch, valid_json(3))
    response = client.post(
        GENERATE_URL, json=generate_payload(lesson["lesson_id"], number_of_questions=3), headers=_auth_header(inst_a)
    )
    assert response.status_code == 200
    body = response.json()
    assert body["lesson_id"] == lesson["lesson_id"]
    assert body["difficulty"] == "MEDIUM"
    assert body["question_type"] == "MCQ"
    assert len(body["questions"]) == 3
    first_question = body["questions"][0]
    assert "question_text" in first_question
    assert len(first_question["options"]) == 4
    assert sum(1 for opt in first_question["options"] if opt["is_correct"]) == 1


def test_ai_output_capped_to_requested_count(inst_a: User, monkeypatch: pytest.MonkeyPatch) -> None:
    lesson = _create_lesson(inst_a)
    _stub_provider(monkeypatch, valid_json(10))
    response = client.post(
        GENERATE_URL, json=generate_payload(lesson["lesson_id"], number_of_questions=3), headers=_auth_header(inst_a)
    )
    assert response.status_code == 200
    assert len(response.json()["questions"]) == 3


def test_ai_generate_does_not_persist(inst_a: User, monkeypatch: pytest.MonkeyPatch) -> None:
    lesson = _create_lesson(inst_a)
    _stub_provider(monkeypatch, valid_json(3))
    response = client.post(
        GENERATE_URL, json=generate_payload(lesson["lesson_id"], number_of_questions=3), headers=_auth_header(inst_a)
    )
    assert response.status_code == 200

    db = SessionLocal()
    try:
        assert db.scalar(select(Quiz).where(Quiz.lesson_id == lesson["lesson_id"])) is None
        assert db.scalars(select(Question).where(Question.quiz_id.in_(select(Quiz.id).where(Quiz.lesson_id == lesson["lesson_id"])))).first() is None
    finally:
        db.close()


def test_ai_api_key_never_returned(inst_a: User, monkeypatch: pytest.MonkeyPatch) -> None:
    lesson = _create_lesson(inst_a)
    _stub_provider(monkeypatch, valid_json(1))
    response = client.post(
        GENERATE_URL, json=generate_payload(lesson["lesson_id"], number_of_questions=1), headers=_auth_header(inst_a)
    )
    assert response.status_code == 200
    serialized = json.dumps(response.json()).lower()
    assert "api_key" not in serialized
    assert "apikey" not in serialized
    assert "authorization" not in serialized


# --------------------------------------------------------------------------
# Save flow
# --------------------------------------------------------------------------


def approved_questions(count: int = 2) -> list[dict]:
    questions = []
    for i in range(1, count + 1):
        questions.append(
            {
                "question_text": f"Approved question {i}?",
                "question_type": "MCQ",
                "points": 2,
                "options": [
                    {"option_text": f"Correct {i}", "is_correct": True},
                    {"option_text": f"Wrong {i}", "is_correct": False},
                ],
            }
        )
    return questions


def test_ai_save_creates_quiz_when_missing(inst_a: User) -> None:
    lesson = _create_lesson(inst_a)
    response = client.post(
        SAVE_URL, json={"lesson_id": lesson["lesson_id"], "questions": approved_questions()}, headers=_auth_header(inst_a)
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["lesson_id"] == lesson["lesson_id"]
    assert body["quiz_id"] > 0
    assert len(body["questions"]) == 2

    db = SessionLocal()
    try:
        quiz = db.scalar(select(Quiz).where(Quiz.lesson_id == lesson["lesson_id"]))
        assert quiz is not None
        assert quiz.title == "Lesson Quiz"
        questions = db.scalars(select(Question).where(Question.quiz_id == quiz.id)).all()
        assert len(questions) == 2
        options = db.scalars(select(Option).where(Option.question_id == questions[0].id)).all()
        assert len(options) == 2
        assert sum(1 for opt in options if opt.is_correct) == 1
        assert quiz.id == body["quiz_id"]
    finally:
        db.close()


def test_ai_save_reuses_existing_quiz(inst_a: User) -> None:
    lesson = _create_lesson(inst_a)
    headers = _auth_header(inst_a)
    first = client.post(
        SAVE_URL, json={"lesson_id": lesson["lesson_id"], "questions": approved_questions(2)}, headers=headers
    ).json()
    second = client.post(
        SAVE_URL, json={"lesson_id": lesson["lesson_id"], "questions": approved_questions(1)}, headers=headers
    ).json()

    assert second["quiz_id"] == first["quiz_id"]

    db = SessionLocal()
    try:
        quizzes = db.scalars(select(Quiz).where(Quiz.lesson_id == lesson["lesson_id"])).all()
        assert len(quizzes) == 1
        quiz = quizzes[0]
        questions = db.scalars(select(Question).where(Question.quiz_id == quiz.id)).all()
        assert len(questions) == 3
        assert [q.order_index for q in questions] == [1, 2, 3]
    finally:
        db.close()


def test_ai_save_invalid_questions_422(inst_a: User) -> None:
    lesson = _create_lesson(inst_a)
    no_correct = {
        "question_text": "No correct option?",
        "question_type": "MCQ",
        "points": 1,
        "options": [
            {"option_text": "A", "is_correct": False},
            {"option_text": "B", "is_correct": False},
        ],
    }
    two_correct = {
        "question_text": "Two correct options?",
        "question_type": "MCQ",
        "points": 1,
        "options": [
            {"option_text": "A", "is_correct": True},
            {"option_text": "B", "is_correct": True},
        ],
    }
    headers = _auth_header(inst_a)
    assert client.post(
        SAVE_URL, json={"lesson_id": lesson["lesson_id"], "questions": [no_correct]}, headers=headers
    ).status_code == 422
    assert client.post(
        SAVE_URL, json={"lesson_id": lesson["lesson_id"], "questions": [two_correct]}, headers=headers
    ).status_code == 422
    assert client.post(
        SAVE_URL, json={"lesson_id": lesson["lesson_id"], "questions": []}, headers=headers
    ).status_code == 422


def test_ai_save_does_not_duplicate_quiz_on_error(inst_a: User) -> None:
    lesson = _create_lesson(inst_a)
    bad = {
        "question_text": "Broken",
        "question_type": "MCQ",
        "points": 1,
        "options": [{"option_text": "A", "is_correct": False}],
    }
    response = client.post(
        SAVE_URL, json={"lesson_id": lesson["lesson_id"], "questions": [bad]}, headers=_auth_header(inst_a)
    )
    assert response.status_code == 422
    db = SessionLocal()
    try:
        assert db.scalar(select(Quiz).where(Quiz.lesson_id == lesson["lesson_id"])) is None
    finally:
        db.close()


def test_ai_save_validates_approved_content_again(inst_a: User) -> None:
    lesson = _create_lesson(inst_a)
    malicious = {
        "question_text": "Injected",
        "question_type": "MCQ",
        "points": 0,
        "options": [
            {"option_text": "A", "is_correct": True},
            {"option_text": "B", "is_correct": False},
        ],
    }
    response = client.post(
        SAVE_URL, json={"lesson_id": lesson["lesson_id"], "questions": [malicious]}, headers=_auth_header(inst_a)
    )
    assert response.status_code == 422