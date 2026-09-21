# AI Learning Platform

Phase 1 establishes the React/Vite frontend and FastAPI backend foundation. Phase 2A adds backend authentication with JWT and role-based access control (STUDENT, INSTRUCTOR, ADMIN). Phase 2B adds the frontend authentication flow. Phase 3A adds the backend foundation for courses, modules, and lessons. Phase 3B adds the frontend course catalogue and instructor course management. Phase 4 adds student enrollment, lesson completion tracking, and the learning dashboard. Phase 5 adds per-lesson quizzes with backend-authoritative scoring, attempts, and result review. Phase 6 adds AI-powered quiz question generation for instructors and admins, with instructor review/editing before questions are saved into the existing lesson quiz. Analytics and reports are not implemented yet.

## Prerequisites

- Node.js 20+
- Python 3.11+ from the official CPython distribution
- A Supabase PostgreSQL connection string for database-backed phases

## Frontend

```powershell
cd frontend
copy .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

## Backend

```powershell
cd backend
copy .env.example .env
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The backend exposes interactive documentation at `http://localhost:8000/docs`.

## Configuration

The backend reads the following from `backend/.env`:

| Variable | Description |
|---------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET_KEY` | Secret used to sign access tokens (never commit a real secret) |
| `JWT_ALGORITHM` | JWT signing algorithm, e.g. `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime in minutes |
| `AI_PROVIDER` | `mock` (default, deterministic, no network) or `openai` |
| `AI_API_KEY` | OpenAI API key used only when `AI_PROVIDER=openai` (never commit) |
| `AI_MODEL` | OpenAI model name, e.g. `gpt-4o-mini` |
| `AI_MAX_QUESTIONS` | Upper bound for questions per generation request (default `20`) |

## Health check

With the backend running:

```powershell
curl http://localhost:8000/api/v1/health
```

Expected response:

```json
{"status":"ok"}
```

## Authentication API

All authentication endpoints are under `/api/v1/auth`. Use `Authorization: Bearer <token>` for protected routes.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/register` | Public | Register a new STUDENT account |
| `POST` | `/api/v1/auth/login` | Public | Verify credentials and return a JWT |
| `GET` | `/api/v1/auth/me` | Any role | Return the current authenticated user |
| `GET` | `/api/v1/auth/test/student` | STUDENT | Check student access (test endpoint) |
| `GET` | `/api/v1/auth/test/instructor` | INSTRUCTOR | Check instructor access (test endpoint) |
| `GET` | `/api/v1/auth/test/admin` | ADMIN | Check admin access (test endpoint) |

Register payload:

```json
{"name": "Jane Doe", "email": "jane@example.com", "password": "securePassword123"}
```

Login payload:

```json
{"email": "jane@example.com", "password": "securePassword123"}
```

Login response:

```json
{"access_token": "<jwt>", "token_type": "bearer"}
```

Registration always creates a `STUDENT` account. Password hashes are stored with bcrypt and never returned through API responses.

## Course API

Course content endpoints are under `/api/v1/courses`. Write access requires an INSTRUCTOR or ADMIN. Ownership is always derived from the authenticated JWT, never from client-supplied fields.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/v1/courses` | INSTRUCTOR, ADMIN | Create an unpublished course |
| `GET` | `/api/v1/courses` | Any authenticated user | List visible courses (published, or own/admin) |
| `GET` | `/api/v1/courses/{course_id}` | Any authenticated user | Course detail with visibility rules |
| `PATCH` | `/api/v1/courses/{course_id}` | Owner, ADMIN | Update course |
| `DELETE` | `/api/v1/courses/{course_id}` | Owner, ADMIN | Delete course (cascades modules/lessons) |
| `POST` | `/api/v1/courses/{course_id}/publish` | Owner, ADMIN | Publish course (requires at least one module) |
| `POST` | `/api/v1/courses/{course_id}/unpublish` | Owner, ADMIN | Unpublish course |
| `POST` | `/api/v1/courses/{course_id}/modules` | Owner, ADMIN | Create module |
| `GET` | `/api/v1/courses/{course_id}/modules` | Visible course | List modules in order |
| `PATCH`/`DELETE` | `/api/v1/courses/{course_id}/modules/{module_id}` | Owner, ADMIN | Update/delete module |
| `POST` | `/api/v1/courses/{course_id}/modules/{module_id}/lessons` | Owner, ADMIN | Create lesson |
| `GET` | `/api/v1/courses/{course_id}/modules/{module_id}/lessons` | Visible course | List lessons in order |
| `PATCH`/`DELETE` | `.../modules/{module_id}/lessons/{lesson_id}` | Owner, ADMIN | Update/delete lesson |

Visibility: students see published courses and their structure only; the owning instructor and admins see everything. `instructor_id` is always taken from the authenticated user.

## Enrollment & Progress API

Enrollment and learning-progress endpoints are under `/api/v1`. All endpoints are STUDENT-only, and the `student_id` is always taken from the authenticated JWT (never from the request body). Accessing lesson progress requires an active enrollment in the lesson&apos;s published course.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/v1/enrollments/{course_id}` | STUDENT | Enroll in a published course (409 if already enrolled) |
| `GET` | `/api/v1/enrollments` | STUDENT | List my enrollments with course, progress, and next lesson |
| `GET` | `/api/v1/enrollments/{course_id}` | STUDENT | Enrollment detail for a course (404 if not enrolled) |
| `DELETE` | `/api/v1/enrollments/{course_id}` | STUDENT | Unenroll (removes enrollment and all progress) |
| `GET` | `/api/v1/progress/courses/{course_id}` | STUDENT | Course progress summary + continue-learning target |
| `GET` | `/api/v1/progress/lessons/{lesson_id}` | STUDENT | My lesson progress (zeros if never started) |
| `PUT` | `/api/v1/progress/lessons/{lesson_id}` | STUDENT | Update watch time / last position / completion |

Progress is backend-authoritative and computed as `completed / total × 100` (0% for a course with no lessons; 0–100 inclusive). `enrollment.progress` is a cached value kept consistent on every write. The continue-learning target is the first incomplete lesson in module-then-lesson order. Updating a lesson with `{"completed": true}` sets `completed_at`; unmarking clears it. Marking the final incomplete lesson completes the course (`enrollment.completed_at` is set).

## Quiz & Attempts API

Quiz endpoints are under `/api/v1/quizzes` (quiz browsing and attempt start/list) and `/api/v1/attempts` (attempt detail and submission). All endpoints are STUDENT-only. A student must be enrolled in the published course that owns the quiz; otherwise access is denied (404 for missing/unpublished courses, 403 for enrollment or role failures). `student_id` is always taken from the authenticated JWT. Attempt answers are recorded as `attempt_answers`, and `is_correct` is never exposed while a quiz is being taken — the answer key is only used server-side.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/v1/quizzes/{quiz_id}` | Enrolled STUDENT | Fetch a quiz for taking (questions + options, no `is_correct`) |
| `POST` | `/api/v1/quizzes/{quiz_id}/attempts` | Enrolled STUDENT | Start a new attempt (score and percentage initialized to zero) |
| `GET` | `/api/v1/quizzes/{quiz_id}/attempts` | Enrolled STUDENT | List my attempts for the quiz (newest first) |
| `GET` | `/api/v1/attempts/{attempt_id}` | Owner | Attempt detail with per-question answers and correctness (404 if not the owner) |
| `POST` | `/api/v1/attempts/{attempt_id}/submit` | Owner | Grade and close an attempt |

Scoring is backend-authoritative. On submit the server validates that every submitted question/option ID belongs to this quiz (`422` otherwise), derives correctness from the stored answer key (never from client-supplied values), computes `score`, `total_points`, and `percentage`, stores one `attempt_answers` row per question, and stamps `completed_at`. Completed attempts return `409` on re-submission. A quiz with point values such as `2` and `3` reports `total_points = 5`.

## AI Question Generation API

AI question generation endpoints are under `/api/v1/ai/quizzes`. All endpoints require an INSTRUCTOR or ADMIN. The target lesson must belong to a course managed by the caller (`404` for a missing lesson, `403` for a non-manager). The AI provider is configured server-side only; the frontend never sends or receives API keys.

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/v1/ai/quizzes/generate` | INSTRUCTOR, ADMIN | Generate questions for a lesson/ topic (nothing is persisted) |
| `POST` | `/api/v1/ai/quizzes/save` | INSTRUCTOR, ADMIN | Save instructor-approved questions to the lesson&apos;s quiz (creates one if missing, reuses an existing one otherwise) |

Generate request:

```json
{
  "lesson_id": 5,
  "topic": "Newtonian mechanics and forces",
  "number_of_questions": 4,
  "difficulty": "MEDIUM",
  "question_type": "MCQ"
}
```

Generate response is an `AIQuizGenerateResponse` with `lesson_id`, `difficulty`, `question_type`, and a `questions` array. Every generated question has `question_text`, `question_type` (`MCQ` only), `points`, and `options` (2–10 options with exactly one `is_correct: true`). Generation only drafts questions — the database is untouched until approval. Malformed provider output or schema mismatches return `502`.

Save request is `{"lesson_id": 5, "questions": [...]}` using the same question shape. The backend re-validates everything (question text, points 1–100, 2–10 options, exactly one correct option) and returns `201` with `AISaveResponse` containing `lesson_id`, `quiz_id`, and the saved `questions`. If the lesson already has a quiz (enforced by a unique constraint on `quizzes.lesson_id`), the questions are appended to it; otherwise a quiz titled `"{lesson.title} Quiz"` is created. After saving, students enrolled in the published course can take the quiz through the Phase 5 flow.

The OpenAI provider is optional. By default the backend uses a deterministic mock provider (`AI_PROVIDER=mock`), which never makes network calls and is what the test suite uses. Set `AI_PROVIDER=openai` and provide `AI_API_KEY` to call the OpenAI Chat Completions API with a JSON response format. The key is read from `backend/.env` and never exposed to the browser.

## Running the tests

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python -m pytest
```

## Project structure

```text
ai-learning-platform/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── dependencies.py
│   │   ├── core/
│   │   │   ├── jwt.py
│   │   │   └── security.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── course.py
│   │   │   ├── module.py
│   │   │   ├── lesson.py
│   │   │   ├── enrollment.py
│   │   │   ├── lesson_progress.py
│   │   │   ├── quiz.py
│   │   │   ├── question.py
│   │   │   ├── option.py
│   │   │   ├── quiz_attempt.py
│   │   │   └── attempt_answer.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── course.py
│   │   │   ├── learning.py
│   │   │   ├── quiz.py
│   │   │   └── ai.py
│   │   ├── services/
│   │   │   ├── course_service.py
│   │   │   ├── enrollment_service.py
│   │   │   ├── progress_service.py
│   │   │   ├── quiz_service.py
│   │   │   ├── ai_provider.py
│   │   │   └── ai_question_service.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── health.py
│   │   │   ├── courses.py
│   │   │   ├── modules.py
│   │   │   ├── lessons.py
│   │   │   ├── enrollments.py
│   │   │   ├── progress.py
│   │   │   ├── quizzes.py
│   │   │   ├── attempts.py
│   │   │   └── ai.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_courses.py
│   │   ├── test_enrollment_progress.py
│   │   ├── test_quizzes.py
│   │   ├── test_ai_generation.py
│   │   └── conftest.py
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── pytest.ini
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppLayout.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── RequireRole.jsx
│   │   │   ├── StateMessage.jsx
│   │   │   ├── courses/...
│   │   │   └── learning/
│   │   │       ├── ProgressBar.jsx
│   │   │       └── EnrollmentPanel.jsx
│   │   ├── constants/
│   │   │   ├── courses.js
│   │   │   └── roles.js
│   │   ├── hooks/useAuth.js
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── StudentArea.jsx
│   │   │   ├── InstructorArea.jsx
│   │   │   ├── AdminArea.jsx
│   │   │   ├── student/
│   │   │   │   ├── CourseListPage.jsx
│   │   │   │   ├── CourseDetailPage.jsx
│   │   │   │   ├── StudentLearningDashboard.jsx
│   │   │   │   ├── LessonLearningPage.jsx
│   │   │   │   ├── QuizPage.jsx
│   │   │   │   └── QuizResultPage.jsx
│   │   │   └── instructor/
│   │   │       ├── AIQuizGenerator.jsx
│   │   │       ├── InstructorCoursesPage.jsx
│   │   │       ├── InstructorCourseFormPage.jsx
│   │   │       └── InstructorCourseContentPage.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── courseService.js
│   │   │   ├── moduleService.js
│   │   │   ├── lessonService.js
│   │   │   ├── enrollmentService.js
│   │   │   ├── progressService.js
│   │   │   ├── quizService.js
│   │   │   ├── aiService.js
│   │   │   └── tokenStorage.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── .env.example
├── .env.example
├── .gitignore
└── README.md
```