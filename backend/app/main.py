from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
import app.models  # noqa: F401
from app.routers.ai import router as ai_router
from app.routers.analytics import router as analytics_router
from app.routers.attempts import router as attempts_router
from app.routers.auth import router as auth_router
from app.routers.courses import router as courses_router
from app.routers.enrollments import router as enrollments_router
from app.routers.games import router as games_router
from app.routers.gamification import router as gamification_router
from app.routers.health import router as health_router
from app.routers.lessons import router as lessons_router
from app.routers.modules import router as modules_router
from app.routers.progress import router as progress_router
from app.routers.quizzes import router as quizzes_router
from app.routers.recommendations import router as recommendations_router
from app.routers.saved import router as saved_router

from pathlib import Path
from fastapi.staticfiles import StaticFiles

# Ensure newly defined tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name, version="0.1.0")

uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
(uploads_dir / "avatars").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(courses_router, prefix="/api/v1")
app.include_router(modules_router, prefix="/api/v1")
app.include_router(lessons_router, prefix="/api/v1")
app.include_router(enrollments_router, prefix="/api/v1")
app.include_router(progress_router, prefix="/api/v1")
app.include_router(quizzes_router, prefix="/api/v1")
app.include_router(attempts_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(recommendations_router, prefix="/api/v1")
app.include_router(gamification_router, prefix="/api/v1")
app.include_router(games_router, prefix="/api/v1")
app.include_router(saved_router, prefix="/api/v1")