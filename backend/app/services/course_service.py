from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import Course, Lesson, Module, User, UserRole


def _get_course(db: Session, course_id: int) -> Course:
    course = db.scalar(select(Course).where(Course.id == course_id))
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


def is_manager(course: Course, user: User) -> bool:
    return user.role == UserRole.ADMIN or course.instructor_id == user.id


def require_course_manager(db: Session, course_id: int, user: User) -> Course:
    course = _get_course(db, course_id)
    if not is_manager(course, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage this course",
        )
    return course


def get_visible_course(db: Session, course_id: int, user: User) -> Course:
    course = _get_course(db, course_id)
    if course.published or is_manager(course, user):
        return course
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")


def list_visible_courses(db: Session, user: User) -> list[Course]:
    statement = select(Course)
    if user.role != UserRole.ADMIN:
        statement = statement.where(
            or_(Course.published.is_(True), Course.instructor_id == user.id)
        )
    return list(db.scalars(statement.order_by(Course.created_at.desc())))


def find_module_in_course(
    db: Session, module_id: int, course_id: int
) -> Module:
    module = db.scalar(
        select(Module).where(Module.id == module_id, Module.course_id == course_id)
    )
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    return module


def get_module_for_course(db: Session, module_id: int, course_id: int, user: User) -> Module:
    require_course_manager(db, course_id, user)
    return find_module_in_course(db, module_id, course_id)


def get_lesson_for_module(
    db: Session, lesson_id: int, module_id: int, course_id: int, user: User
) -> Lesson:
    module = get_module_for_course(db, module_id, course_id, user)
    lesson = db.scalar(
        select(Lesson).where(Lesson.id == lesson_id, Lesson.module_id == module.id)
    )
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return lesson


def get_managed_lesson(db: Session, lesson_id: int, user: User) -> Lesson:
    row = db.execute(
        select(Lesson, Course)
        .join(Module, Lesson.module_id == Module.id)
        .join(Course, Module.course_id == Course.id)
        .where(Lesson.id == lesson_id)
    ).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    lesson, course = row
    if not is_manager(course, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to manage this course",
        )
    return lesson


def list_modules_by_course(db: Session, course_id: int) -> list[Module]:
    return list(
        db.scalars(
            select(Module)
            .where(Module.course_id == course_id)
            .order_by(Module.order_number, Module.id)
        )
    )


def list_lessons_by_module(db: Session, module_id: int) -> list[Lesson]:
    return list(
        db.scalars(
            select(Lesson)
            .where(Lesson.module_id == module_id)
            .order_by(Lesson.order_number, Lesson.id)
        )
    )


def next_module_order(db: Session, course_id: int) -> int:
    highest = db.scalar(
        select(func.max(Module.order_number)).where(Module.course_id == course_id)
    )
    return (highest or 0) + 1


def next_lesson_order(db: Session, module_id: int) -> int:
    highest = db.scalar(
        select(func.max(Lesson.order_number)).where(Lesson.module_id == module_id)
    )
    return (highest or 0) + 1


def ensure_publishable(db: Session, course: Course) -> None:
    module_count = db.scalar(
        select(func.count(Module.id)).where(Module.course_id == course.id)
    )
    if not module_count:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot publish a course without modules",
        )