from __future__ import annotations

import math
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models import Course, Enrollment, Lesson, LessonProgress, Module, Quiz
from app.models.study_plan import (
    PlanStatus,
    StudyPlan,
    StudyPlanTask,
    TaskPriority,
    TaskStatus,
    TaskType,
)
from app.schemas.learning import LessonProgressUpdate
from app.schemas.study_plan import (
    PlanStatus as SchemaPlanStatus,
    StudyPlanCreate,
    StudyPlanDetailResponse,
    StudyPlanRescheduleRequest,
    StudyPlanResponse,
    StudyPlanTaskCreate,
    StudyPlanTaskResponse,
    StudyPlanTaskUpdate,
    StudyPlanUpdate,
    TodayPlanResponse,
    WeeklyDayPlan,
    WeeklyPlanResponse,
)
from app.services import enrollment_service


def _get_active_course(db: Session, course_id: int) -> Course:
    course = db.scalar(select(Course).where(Course.id == course_id))
    if course is None or not course.published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


def _calculate_plan_health(
    plan: StudyPlan, tasks: list[StudyPlanTask], today: date
) -> tuple[str, str, int, int]:
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
    overdue = sum(
        1
        for t in tasks
        if t.scheduled_date < today and t.status not in (TaskStatus.COMPLETED, TaskStatus.SKIPPED)
    )
    expected_by_today = sum(1 for t in tasks if t.scheduled_date <= today)
    days_remaining = (plan.target_date - today).days

    remaining_minutes = sum(
        t.estimated_minutes
        for t in tasks
        if t.status not in (TaskStatus.COMPLETED, TaskStatus.SKIPPED)
    )

    if total == 0:
        return "ON_TRACK", "No tasks scheduled.", days_remaining, remaining_minutes

    if completed == total:
        return "COMPLETED", "All tasks completed! Congratulations!", days_remaining, 0

    if overdue >= 3 or (days_remaining <= 0 and completed < total):
        return "AT_RISK", f"{overdue} task(s) overdue. Consider rescheduling.", days_remaining, remaining_minutes

    if overdue > 0:
        return "AT_RISK", f"{overdue} task(s) overdue.", days_remaining, remaining_minutes

    if completed > expected_by_today:
        return "AHEAD", "Great job! You are ahead of schedule.", days_remaining, remaining_minutes

    return "ON_TRACK", "You are on track to finish by your target date.", days_remaining, remaining_minutes


def _build_task_response(task: StudyPlanTask, today: date) -> StudyPlanTaskResponse:
    is_overdue = (
        task.scheduled_date < today
        and task.status not in (TaskStatus.COMPLETED, TaskStatus.SKIPPED)
    )
    return StudyPlanTaskResponse(
        id=task.id,
        study_plan_id=task.study_plan_id,
        student_id=task.student_id,
        course_id=task.course_id,
        course_title=task.course.title if task.course else None,
        module_id=task.module_id,
        module_title=task.module.title if task.module else None,
        lesson_id=task.lesson_id,
        lesson_title=task.lesson.title if task.lesson else None,
        quiz_id=task.quiz_id,
        quiz_title=task.quiz.title if task.quiz else None,
        task_type=task.task_type,
        title=task.title,
        description=task.description,
        scheduled_date=task.scheduled_date,
        estimated_minutes=task.estimated_minutes,
        priority=task.priority,
        status=task.status,
        completed_at=task.completed_at,
        is_overdue=is_overdue,
        sort_order=task.sort_order,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


def _build_plan_response(
    db: Session, plan: StudyPlan, tasks: list[StudyPlanTask] | None = None
) -> StudyPlanResponse:
    today = date.today()
    if tasks is None:
        tasks = list(
            db.scalars(
                select(StudyPlanTask)
                .where(StudyPlanTask.study_plan_id == plan.id)
                .order_by(StudyPlanTask.scheduled_date, StudyPlanTask.sort_order)
            )
        )

    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
    overdue_tasks = sum(
        1
        for t in tasks
        if t.scheduled_date < today and t.status not in (TaskStatus.COMPLETED, TaskStatus.SKIPPED)
    )
    pending_tasks = total_tasks - completed_tasks

    progress_percentage = (
        round((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0
    )

    # Real course progress
    _, _, course_progress_pct = enrollment_service.compute_course_progress(
        db, plan.student_id, plan.course_id
    )

    health_status, health_msg, days_rem, rem_mins = _calculate_plan_health(plan, tasks, today)

    return StudyPlanResponse(
        id=plan.id,
        student_id=plan.student_id,
        course_id=plan.course_id,
        course_title=plan.course.title if plan.course else "Unknown Course",
        course_thumbnail_url=plan.course.thumbnail_url if plan.course else None,
        title=plan.title,
        description=plan.description,
        target_date=plan.target_date,
        daily_minutes_goal=plan.daily_minutes_goal,
        preferred_days=plan.preferred_days,
        status=plan.status,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        overdue_tasks=overdue_tasks,
        pending_tasks=pending_tasks,
        progress_percentage=progress_percentage,
        course_progress_percentage=course_progress_pct,
        health_status=health_status,
        health_message=health_msg,
        days_remaining=days_rem,
        estimated_total_minutes_remaining=rem_mins,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
    )


def create_and_generate_study_plan(
    db: Session, student_id: int, payload: StudyPlanCreate
) -> StudyPlanDetailResponse:
    today = date.today()
    if payload.target_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target completion date must be today or in the future",
        )

    course = _get_active_course(db, payload.course_id)

    # 1. Ensure enrollment exists
    enrollment = enrollment_service.get_enrollment(db, student_id, payload.course_id)
    if not enrollment:
        enrollment_service.enroll_in_course(db, student_id, payload.course_id)

    # 2. Create the study_plan row
    plan_title = payload.title.strip() if payload.title and payload.title.strip() else f"Study Plan: {course.title}"
    pref_days = payload.preferred_days or [0, 1, 2, 3, 4, 5]  # Default Mon-Sat

    plan = StudyPlan(
        student_id=student_id,
        course_id=course.id,
        title=plan_title,
        description=payload.description,
        target_date=payload.target_date,
        daily_minutes_goal=payload.daily_minutes_goal,
        preferred_days=pref_days,
        status=PlanStatus.ACTIVE,
    )
    db.add(plan)
    db.flush()

    # 3. Retrieve curriculum items in order
    modules = list(
        db.scalars(
            select(Module)
            .where(Module.course_id == course.id)
            .order_by(Module.order_number, Module.id)
        )
    )

    progress_map = enrollment_service._progress_map(db, student_id)

    curriculum_items: list[dict] = []
    for mod in modules:
        lessons = list(
            db.scalars(
                select(Lesson)
                .options(joinedload(Lesson.quiz))
                .where(Lesson.module_id == mod.id)
                .order_by(Lesson.order_number, Lesson.id)
            )
        )
        for les in lessons:
            # Check if lesson is already completed
            lp = progress_map.get(les.id)
            is_completed = lp.completed if lp else False

            # Add lesson item
            curriculum_items.append({
                "type": TaskType.LESSON,
                "title": f"Lesson: {les.title}",
                "description": les.description or f"Module: {mod.title}",
                "module_id": mod.id,
                "lesson_id": les.id,
                "quiz_id": None,
                "estimated_minutes": les.duration_minutes or 20,
                "priority": TaskPriority.MEDIUM,
                "is_completed": is_completed,
            })

            # If lesson has a quiz and quizzes included
            if payload.include_quizzes and les.quiz:
                curriculum_items.append({
                    "type": TaskType.QUIZ,
                    "title": f"Quiz: {les.quiz.title}",
                    "description": f"Check understanding for {les.title}",
                    "module_id": mod.id,
                    "lesson_id": les.id,
                    "quiz_id": les.quiz.id,
                    "estimated_minutes": 15,
                    "priority": TaskPriority.HIGH,
                    "is_completed": False,  # Can always review quiz
                })

    # If no curriculum items exist (empty course)
    if not curriculum_items:
        db.commit()
        db.refresh(plan)
        plan_resp = _build_plan_response(db, plan, [])
        return StudyPlanDetailResponse(**plan_resp.model_dump(), tasks=[])

    # 4. Generate candidate dates between start_date (today) and target_date
    candidate_dates: list[date] = []
    curr = today
    while curr <= payload.target_date:
        if curr.weekday() in pref_days:
            candidate_dates.append(curr)
        curr += timedelta(days=1)

    if not candidate_dates:
        # Fallback to all days if preferred days produced 0 matches
        curr = today
        while curr <= payload.target_date:
            candidate_dates.append(curr)
            curr += timedelta(days=1)

    # 5. Distribute items across candidate dates
    # Target minutes per day
    daily_budget = payload.daily_minutes_goal
    tasks_to_add: list[StudyPlanTask] = []

    date_idx = 0
    day_used_minutes = 0
    day_sort_order = 0

    num_dates = len(candidate_dates)
    total_items = len(curriculum_items)

    # If we have more days than items, spread them out evenly
    step = max(1, num_dates / total_items) if num_dates > total_items else 1

    for idx, item in enumerate(curriculum_items):
        if num_dates > total_items:
            assigned_date_idx = min(int(idx * step), num_dates - 1)
            target_sched_date = candidate_dates[assigned_date_idx]
            day_sort_order += 1
        else:
            # Pack according to daily budget
            if day_used_minutes >= daily_budget and date_idx < num_dates - 1:
                date_idx += 1
                day_used_minutes = 0
                day_sort_order = 0

            target_sched_date = candidate_dates[date_idx]
            day_used_minutes += item["estimated_minutes"]
            day_sort_order += 1

        t_status = TaskStatus.COMPLETED if item["is_completed"] else TaskStatus.PENDING
        t_comp_at = datetime.now(timezone.utc) if item["is_completed"] else None

        task_row = StudyPlanTask(
            study_plan_id=plan.id,
            student_id=student_id,
            course_id=course.id,
            module_id=item["module_id"],
            lesson_id=item["lesson_id"],
            quiz_id=item["quiz_id"],
            task_type=item["type"],
            title=item["title"],
            description=item["description"],
            scheduled_date=target_sched_date,
            estimated_minutes=item["estimated_minutes"],
            priority=item["priority"],
            status=t_status,
            completed_at=t_comp_at,
            sort_order=day_sort_order,
        )
        tasks_to_add.append(task_row)

    db.add_all(tasks_to_add)
    db.commit()
    db.refresh(plan)

    # Load tasks with relationships
    created_tasks = list(
        db.scalars(
            select(StudyPlanTask)
            .options(
                joinedload(StudyPlanTask.course),
                joinedload(StudyPlanTask.module),
                joinedload(StudyPlanTask.lesson),
                joinedload(StudyPlanTask.quiz),
            )
            .where(StudyPlanTask.study_plan_id == plan.id)
            .order_by(StudyPlanTask.scheduled_date, StudyPlanTask.sort_order)
        )
    )

    plan_base = _build_plan_response(db, plan, created_tasks)
    task_responses = [_build_task_response(t, today) for t in created_tasks]
    return StudyPlanDetailResponse(**plan_base.model_dump(), tasks=task_responses)


def list_student_study_plans(db: Session, student_id: int) -> list[StudyPlanResponse]:
    plans = list(
        db.scalars(
            select(StudyPlan)
            .options(joinedload(StudyPlan.course))
            .where(StudyPlan.student_id == student_id)
            .order_by(StudyPlan.created_at.desc())
        )
    )
    return [_build_plan_response(db, p) for p in plans]


def get_study_plan_or_404(db: Session, student_id: int, plan_id: int) -> StudyPlan:
    plan = db.scalar(
        select(StudyPlan)
        .options(joinedload(StudyPlan.course))
        .where(StudyPlan.id == plan_id, StudyPlan.student_id == student_id)
    )
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study plan not found or not accessible",
        )
    return plan


def get_study_plan_detail(
    db: Session, student_id: int, plan_id: int
) -> StudyPlanDetailResponse:
    plan = get_study_plan_or_404(db, student_id, plan_id)
    today = date.today()

    tasks = list(
        db.scalars(
            select(StudyPlanTask)
            .options(
                joinedload(StudyPlanTask.course),
                joinedload(StudyPlanTask.module),
                joinedload(StudyPlanTask.lesson),
                joinedload(StudyPlanTask.quiz),
            )
            .where(StudyPlanTask.study_plan_id == plan.id)
            .order_by(StudyPlanTask.scheduled_date, StudyPlanTask.sort_order)
        )
    )

    plan_base = _build_plan_response(db, plan, tasks)
    task_responses = [_build_task_response(t, today) for t in tasks]
    return StudyPlanDetailResponse(**plan_base.model_dump(), tasks=task_responses)


def update_study_plan(
    db: Session, student_id: int, plan_id: int, payload: StudyPlanUpdate
) -> StudyPlanResponse:
    plan = get_study_plan_or_404(db, student_id, plan_id)

    if payload.title is not None and payload.title.strip():
        plan.title = payload.title.strip()
    if payload.description is not None:
        plan.description = payload.description.strip() or None
    if payload.target_date is not None:
        if payload.target_date < date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target date cannot be in the past",
            )
        plan.target_date = payload.target_date
    if payload.daily_minutes_goal is not None:
        plan.daily_minutes_goal = payload.daily_minutes_goal
    if payload.preferred_days is not None:
        plan.preferred_days = payload.preferred_days
    if payload.status is not None:
        plan.status = payload.status

    db.commit()
    db.refresh(plan)
    return _build_plan_response(db, plan)


def delete_study_plan(db: Session, student_id: int, plan_id: int) -> None:
    plan = get_study_plan_or_404(db, student_id, plan_id)
    db.delete(plan)
    db.commit()


def complete_plan_task(
    db: Session, student_id: int, task_id: int
) -> StudyPlanTaskResponse:
    task = db.scalar(
        select(StudyPlanTask)
        .options(
            joinedload(StudyPlanTask.course),
            joinedload(StudyPlanTask.module),
            joinedload(StudyPlanTask.lesson),
            joinedload(StudyPlanTask.quiz),
            joinedload(StudyPlanTask.study_plan),
        )
        .where(StudyPlanTask.id == task_id, StudyPlanTask.student_id == student_id)
    )
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or not accessible",
        )

    task.status = TaskStatus.COMPLETED
    task.completed_at = datetime.now(timezone.utc)

    # Sync to real lesson progress
    if task.lesson_id:
        from app.services import progress_service

        progress_service.update_lesson_progress(
            db,
            student_id=student_id,
            lesson_id=task.lesson_id,
            payload=LessonProgressUpdate(completed=True),
        )

    # Check if all tasks in plan are complete
    pending_count = db.scalar(
        select(func.count(StudyPlanTask.id)).where(
            StudyPlanTask.study_plan_id == task.study_plan_id,
            StudyPlanTask.status != TaskStatus.COMPLETED,
        )
    )
    if pending_count == 0:
        task.study_plan.status = PlanStatus.COMPLETED

    db.commit()
    db.refresh(task)
    return _build_task_response(task, date.today())


def update_plan_task(
    db: Session, student_id: int, task_id: int, payload: StudyPlanTaskUpdate
) -> StudyPlanTaskResponse:
    task = db.scalar(
        select(StudyPlanTask)
        .options(
            joinedload(StudyPlanTask.course),
            joinedload(StudyPlanTask.module),
            joinedload(StudyPlanTask.lesson),
            joinedload(StudyPlanTask.quiz),
        )
        .where(StudyPlanTask.id == task_id, StudyPlanTask.student_id == student_id)
    )
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or not accessible",
        )

    if payload.title is not None and payload.title.strip():
        task.title = payload.title.strip()
    if payload.description is not None:
        task.description = payload.description.strip() or None
    if payload.scheduled_date is not None:
        task.scheduled_date = payload.scheduled_date
    if payload.estimated_minutes is not None:
        task.estimated_minutes = payload.estimated_minutes
    if payload.priority is not None:
        task.priority = payload.priority
    if payload.sort_order is not None:
        task.sort_order = payload.sort_order
    if payload.status is not None:
        task.status = payload.status
        if payload.status == TaskStatus.COMPLETED:
            task.completed_at = datetime.now(timezone.utc)
            if task.lesson_id:
                from app.services import progress_service
                progress_service.update_lesson_progress(
                    db,
                    student_id=student_id,
                    lesson_id=task.lesson_id,
                    payload=LessonProgressUpdate(completed=True),
                )
        else:
            task.completed_at = None

    db.commit()
    db.refresh(task)
    return _build_task_response(task, date.today())


def delete_plan_task(db: Session, student_id: int, task_id: int) -> None:
    task = db.scalar(
        select(StudyPlanTask).where(
            StudyPlanTask.id == task_id, StudyPlanTask.student_id == student_id
        )
    )
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or not accessible",
        )
    db.delete(task)
    db.commit()


def reschedule_study_plan(
    db: Session, student_id: int, plan_id: int, payload: StudyPlanRescheduleRequest
) -> StudyPlanDetailResponse:
    plan = get_study_plan_or_404(db, student_id, plan_id)
    today = date.today()

    if payload.new_target_date:
        if payload.new_target_date < today:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New target date cannot be in the past",
            )
        plan.target_date = payload.new_target_date

    if payload.daily_minutes_goal:
        plan.daily_minutes_goal = payload.daily_minutes_goal

    if payload.preferred_days:
        plan.preferred_days = payload.preferred_days

    # Identify tasks to reschedule
    query = (
        select(StudyPlanTask)
        .options(
            joinedload(StudyPlanTask.course),
            joinedload(StudyPlanTask.module),
            joinedload(StudyPlanTask.lesson),
            joinedload(StudyPlanTask.quiz),
        )
        .where(
            StudyPlanTask.study_plan_id == plan.id,
            StudyPlanTask.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
        )
    )

    if payload.reschedule_mode == "OVERDUE_ONLY":
        query = query.where(StudyPlanTask.scheduled_date < today)

    tasks_to_reschedule = list(
        db.scalars(query.order_by(StudyPlanTask.scheduled_date, StudyPlanTask.sort_order))
    )

    if tasks_to_reschedule:
        # Generate candidate dates from today to target_date
        pref_days = plan.preferred_days or [0, 1, 2, 3, 4, 5]
        effective_target = max(plan.target_date, today + timedelta(days=len(tasks_to_reschedule)))

        candidate_dates: list[date] = []
        curr = today
        while curr <= effective_target:
            if curr.weekday() in pref_days:
                candidate_dates.append(curr)
            curr += timedelta(days=1)

        if not candidate_dates:
            curr = today
            while curr <= effective_target:
                candidate_dates.append(curr)
                curr += timedelta(days=1)

        daily_budget = plan.daily_minutes_goal
        date_idx = 0
        day_used = 0
        sort_ord = 0

        for t in tasks_to_reschedule:
            if day_used >= daily_budget and date_idx < len(candidate_dates) - 1:
                date_idx += 1
                day_used = 0
                sort_ord = 0

            t.scheduled_date = candidate_dates[date_idx]
            sort_ord += 1
            t.sort_order = sort_ord
            day_used += t.estimated_minutes

        # If effective_target exceeded original target_date, update plan.target_date
        if candidate_dates[date_idx] > plan.target_date:
            plan.target_date = candidate_dates[date_idx]

        db.commit()
        db.refresh(plan)

    return get_study_plan_detail(db, student_id, plan_id)


def get_today_plan(db: Session, student_id: int) -> TodayPlanResponse:
    today = date.today()

    # Tasks scheduled for today across active plans
    today_tasks = list(
        db.scalars(
            select(StudyPlanTask)
            .options(
                joinedload(StudyPlanTask.course),
                joinedload(StudyPlanTask.module),
                joinedload(StudyPlanTask.lesson),
                joinedload(StudyPlanTask.quiz),
            )
            .join(StudyPlan, StudyPlanTask.study_plan_id == StudyPlan.id)
            .where(
                StudyPlanTask.student_id == student_id,
                StudyPlan.status == PlanStatus.ACTIVE,
                StudyPlanTask.scheduled_date == today,
            )
            .order_by(StudyPlanTask.sort_order, StudyPlanTask.id)
        )
    )

    # Overdue tasks
    overdue_tasks = list(
        db.scalars(
            select(StudyPlanTask)
            .options(
                joinedload(StudyPlanTask.course),
                joinedload(StudyPlanTask.module),
                joinedload(StudyPlanTask.lesson),
                joinedload(StudyPlanTask.quiz),
            )
            .join(StudyPlan, StudyPlanTask.study_plan_id == StudyPlan.id)
            .where(
                StudyPlanTask.student_id == student_id,
                StudyPlan.status == PlanStatus.ACTIVE,
                StudyPlanTask.scheduled_date < today,
                StudyPlanTask.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
            )
            .order_by(StudyPlanTask.scheduled_date, StudyPlanTask.sort_order)
        )
    )

    total_tasks = len(today_tasks)
    completed_tasks = sum(1 for t in today_tasks if t.status == TaskStatus.COMPLETED)
    total_mins = sum(t.estimated_minutes for t in today_tasks)
    completed_mins = sum(t.estimated_minutes for t in today_tasks if t.status == TaskStatus.COMPLETED)
    pct = round((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0

    # Get active daily minutes goal
    daily_goal = db.scalar(
        select(StudyPlan.daily_minutes_goal)
        .where(StudyPlan.student_id == student_id, StudyPlan.status == PlanStatus.ACTIVE)
        .limit(1)
    ) or 30

    return TodayPlanResponse(
        date=today,
        tasks=[_build_task_response(t, today) for t in today_tasks],
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        total_estimated_minutes=total_mins,
        completed_minutes=completed_mins,
        daily_minutes_goal=daily_goal,
        progress_percentage=pct,
        overdue_tasks_count=len(overdue_tasks),
        overdue_tasks=[_build_task_response(t, today) for t in overdue_tasks],
    )


def get_weekly_plan(
    db: Session, student_id: int, week_start: date | None = None
) -> WeeklyPlanResponse:
    today = date.today()
    if week_start is None:
        # Start at Monday of current week
        week_start = today - timedelta(days=today.weekday())

    week_end = week_start + timedelta(days=6)

    # Fetch tasks between week_start and week_end
    tasks = list(
        db.scalars(
            select(StudyPlanTask)
            .options(
                joinedload(StudyPlanTask.course),
                joinedload(StudyPlanTask.module),
                joinedload(StudyPlanTask.lesson),
                joinedload(StudyPlanTask.quiz),
            )
            .join(StudyPlan, StudyPlanTask.study_plan_id == StudyPlan.id)
            .where(
                StudyPlanTask.student_id == student_id,
                StudyPlan.status == PlanStatus.ACTIVE,
                StudyPlanTask.scheduled_date >= week_start,
                StudyPlanTask.scheduled_date <= week_end,
            )
            .order_by(StudyPlanTask.scheduled_date, StudyPlanTask.sort_order)
        )
    )

    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    days_data: list[WeeklyDayPlan] = []

    total_tasks_week = len(tasks)
    completed_tasks_week = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)

    for i in range(7):
        current_day = week_start + timedelta(days=i)
        day_tasks = [t for t in tasks if t.scheduled_date == current_day]
        t_mins = sum(t.estimated_minutes for t in day_tasks)
        c_mins = sum(t.estimated_minutes for t in day_tasks if t.status == TaskStatus.COMPLETED)

        days_data.append(
            WeeklyDayPlan(
                date=current_day,
                day_name=day_names[i],
                tasks=[_build_task_response(t, today) for t in day_tasks],
                total_minutes=t_mins,
                completed_minutes=c_mins,
                is_today=(current_day == today),
            )
        )

    return WeeklyPlanResponse(
        week_start=week_start,
        week_end=week_end,
        days=days_data,
        total_tasks_this_week=total_tasks_week,
        completed_tasks_this_week=completed_tasks_week,
    )


def sync_lesson_completion_to_tasks(db: Session, student_id: int, lesson_id: int) -> None:
    """Invoked when student completes a lesson in standard learning flow."""
    tasks = list(
        db.scalars(
            select(StudyPlanTask).where(
                StudyPlanTask.student_id == student_id,
                StudyPlanTask.lesson_id == lesson_id,
                StudyPlanTask.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
            )
        )
    )
    if not tasks:
        return

    now = datetime.now(timezone.utc)
    for t in tasks:
        t.status = TaskStatus.COMPLETED
        t.completed_at = now

    db.flush()
