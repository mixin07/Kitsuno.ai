import uuid
from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.database import SessionLocal
from app.main import app
from app.models import User, UserRole

client = TestClient(app)

BASE = "/api/v1"
PASSWORD = "TestPassword123!"


def _auth_header(user: User) -> dict[str, str]:
    response = client.post(
        f"{BASE}/auth/login", json={"email": user.email, "password": PASSWORD}
    )
    assert response.status_code == 200, "test login failed"
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _seed_student(name: str = "Rec Student") -> User:
    db = SessionLocal()
    try:
        user = User(
            name=name,
            email=f"rec_student_{uuid.uuid4().hex[:8]}@test.com",
            password_hash=hash_password(PASSWORD),
            role=UserRole.STUDENT,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def _seed_instructor() -> User:
    db = SessionLocal()
    try:
        user = User(
            name="Rec Instructor",
            email=f"rec_instructor_{uuid.uuid4().hex[:8]}@test.com",
            password_hash=hash_password(PASSWORD),
            role=UserRole.INSTRUCTOR,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def _create_and_publish_course(instructor: User, title: str = "Rec Course") -> dict:
    headers = _auth_header(instructor)
    c_res = client.post(f"{BASE}/courses", json={"title": title}, headers=headers)
    assert c_res.status_code == 201, c_res.text
    course = c_res.json()

    m_res = client.post(
        f"{BASE}/courses/{course['id']}/modules",
        json={"title": "Module 1", "order_number": 1},
        headers=headers,
    )
    assert m_res.status_code == 201, m_res.text
    mod1 = m_res.json()

    l1_res = client.post(
        f"{BASE}/courses/{course['id']}/modules/{mod1['id']}/lessons",
        json={"title": "Lesson 1.1", "order_number": 1, "duration_minutes": 10},
        headers=headers,
    )
    assert l1_res.status_code == 201, l1_res.text

    l2_res = client.post(
        f"{BASE}/courses/{course['id']}/modules/{mod1['id']}/lessons",
        json={"title": "Lesson 1.2", "order_number": 2, "duration_minutes": 15},
        headers=headers,
    )
    assert l2_res.status_code == 201, l2_res.text

    p_res = client.post(f"{BASE}/courses/{course['id']}/publish", headers=headers)
    assert p_res.status_code == 200, p_res.text
    return p_res.json()


def test_recommendation_unauthenticated():
    res = client.get(f"{BASE}/recommendations/student")
    assert res.status_code == 401


def test_recommendation_no_enrollment():
    student = _seed_student()
    res = client.get(f"{BASE}/recommendations/student", headers=_auth_header(student))
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "no_enrollment"
    assert data["course_id"] is None
    assert "haven't enrolled" in data["explanation"].lower()


def test_recommendation_enrolled_0_progress():
    instructor = _seed_instructor()
    course = _create_and_publish_course(instructor, "Course A")
    student = _seed_student()

    s_headers = _auth_header(student)
    enroll_res = client.post(f"{BASE}/enrollments/{course['id']}", headers=s_headers)
    assert enroll_res.status_code == 201, enroll_res.text

    res = client.get(f"{BASE}/recommendations/student", headers=s_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "in_progress"
    assert data["course_id"] == course["id"]
    assert data["lesson_title"] == "Lesson 1.1"
    assert data["completed_lessons"] == 0
    assert data["total_lessons"] == 2
    assert data["progress_percentage"] == 0


def test_recommendation_partially_completed():
    instructor = _seed_instructor()
    course = _create_and_publish_course(instructor, "Course B")
    student = _seed_student()

    s_headers = _auth_header(student)
    client.post(f"{BASE}/enrollments/{course['id']}", headers=s_headers)

    # Fetch progress to get next lesson (Lesson 1.1)
    prog_res = client.get(f"{BASE}/progress/courses/{course['id']}", headers=s_headers)
    assert prog_res.status_code == 200, prog_res.text
    next_l = prog_res.json()["next_lesson"]
    assert next_l["title"] == "Lesson 1.1"

    # Complete lesson 1.1
    client.put(
        f"{BASE}/progress/lessons/{next_l['id']}",
        json={"completed": True},
        headers=s_headers,
    )

    # Recommendation should now be Lesson 1.2
    res = client.get(f"{BASE}/recommendations/student", headers=s_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "in_progress"
    assert data["lesson_title"] == "Lesson 1.2"
    assert data["completed_lessons"] == 1
    assert data["total_lessons"] == 2
    assert data["progress_percentage"] == 50


def test_recommendation_course_completed():
    instructor = _seed_instructor()
    course = _create_and_publish_course(instructor, "Course C")
    student = _seed_student()

    s_headers = _auth_header(student)
    client.post(f"{BASE}/enrollments/{course['id']}", headers=s_headers)

    # Get course details to complete both lessons
    mod_res = client.get(f"{BASE}/courses/{course['id']}/modules", headers=s_headers)
    assert mod_res.status_code == 200, mod_res.text
    mod_id = mod_res.json()[0]["id"]

    les_res = client.get(
        f"{BASE}/courses/{course['id']}/modules/{mod_id}/lessons", headers=s_headers
    )
    assert les_res.status_code == 200, les_res.text
    lessons = les_res.json()

    for l in lessons:
        client.put(
            f"{BASE}/progress/lessons/{l['id']}",
            json={"completed": True},
            headers=s_headers,
        )

    res = client.get(f"{BASE}/recommendations/student", headers=s_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "completed"
    assert data["course_id"] == course["id"]
    assert data["progress_percentage"] == 100


def test_recommendation_multiple_enrollments():
    instructor = _seed_instructor()
    course1 = _create_and_publish_course(instructor, "Course Completed")
    course2 = _create_and_publish_course(instructor, "Course In Progress")
    student = _seed_student()

    s_headers = _auth_header(student)

    # Enroll in course 1 and complete it
    client.post(f"{BASE}/enrollments/{course1['id']}", headers=s_headers)
    mod_res1 = client.get(f"{BASE}/courses/{course1['id']}/modules", headers=s_headers)
    mod_id1 = mod_res1.json()[0]["id"]
    lessons1 = client.get(
        f"{BASE}/courses/{course1['id']}/modules/{mod_id1}/lessons", headers=s_headers
    ).json()
    for l in lessons1:
        client.put(
            f"{BASE}/progress/lessons/{l['id']}",
            json={"completed": True},
            headers=s_headers,
        )

    # Enroll in course 2
    client.post(f"{BASE}/enrollments/{course2['id']}", headers=s_headers)

    # Recommendation should prioritize Course 2 (which is incomplete) over completed Course 1
    res = client.get(f"{BASE}/recommendations/student", headers=s_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "in_progress"
    assert data["course_id"] == course2["id"]
    assert data["lesson_title"] == "Lesson 1.1"
