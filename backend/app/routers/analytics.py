from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_admin, require_role, require_student
from app.models import Course, User, UserRole
from app.schemas.analytics import (
    AdminAnalyticsResponse,
    InstructorCourseAnalytics,
    InstructorCourseSummary,
    StudentAnalyticsResponse,
)
from app.services import course_service
from app.services.admin_analytics_service import get_admin_analytics
from app.services.instructor_analytics_service import (
    get_instructor_course_analytics,
    list_instructor_course_summaries,
)
from app.services.student_analytics_service import get_student_analytics

router = APIRouter(prefix="/analytics", tags=["Analytics"])

instructor_or_admin = require_role(UserRole.INSTRUCTOR, UserRole.ADMIN)


@router.get("/student", response_model=StudentAnalyticsResponse)
def get_student_analytics_endpoint(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> StudentAnalyticsResponse:
    return get_student_analytics(db, current_user.id)


@router.get("/instructor", response_model=list[InstructorCourseSummary])
def list_instructor_course_summaries_endpoint(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(instructor_or_admin)],
) -> list[InstructorCourseSummary]:
    return list_instructor_course_summaries(db, current_user)


@router.get("/instructor/courses/{course_id}", response_model=InstructorCourseAnalytics)
def get_instructor_course_analytics_endpoint(
    course_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(instructor_or_admin)],
) -> InstructorCourseAnalytics:
    course: Course = course_service.require_course_manager(db, course_id, current_user)
    return get_instructor_course_analytics(db, course)


@router.get("/admin", response_model=AdminAnalyticsResponse)
def get_admin_analytics_endpoint(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
) -> AdminAnalyticsResponse:
    return get_admin_analytics(db)