from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_student
from app.database import get_db
from app.models import Enrollment, User
from app.schemas.learning import EnrollmentDetailResponse, EnrollmentResponse
from app.services import enrollment_service

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


def _to_enrollment_detail(db: Session, enrollment: Enrollment) -> EnrollmentDetailResponse:
    total, completed_count, progress = enrollment_service.compute_course_progress(
        db, enrollment.student_id, enrollment.course_id
    )
    next_lesson = enrollment_service.first_incomplete_lesson(
        db, enrollment.student_id, enrollment.course_id
    )
    return EnrollmentDetailResponse(
        id=enrollment.id,
        student_id=enrollment.student_id,
        course_id=enrollment.course_id,
        progress=progress,
        enrolled_at=enrollment.enrolled_at,
        completed_at=enrollment.completed_at,
        created_at=enrollment.created_at,
        updated_at=enrollment.updated_at,
        total_lessons=total,
        completed_lessons=completed_count,
        next_lesson=next_lesson,
        course=enrollment.course,
    )


@router.post(
    "/{course_id}",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def enroll_in_course(
    course_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> Enrollment:
    return enrollment_service.enroll_in_course(db, current_user.id, course_id)


@router.get("", response_model=list[EnrollmentDetailResponse])
def list_my_enrollments(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> list[EnrollmentDetailResponse]:
    enrollments = enrollment_service.list_student_enrollments(db, current_user.id)
    return [_to_enrollment_detail(db, enrollment) for enrollment in enrollments]


@router.get("/{course_id}", response_model=EnrollmentDetailResponse)
def get_my_enrollment(
    course_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> EnrollmentDetailResponse:
    enrollment = enrollment_service.get_enrollment(db, current_user.id, course_id)
    if enrollment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Enrollment not found")
    return _to_enrollment_detail(db, enrollment)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def unenroll(
    course_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_student)],
) -> None:
    enrollment_service.unenroll_in_course(db, current_user.id, course_id)