from datetime import datetime

from pydantic import BaseModel, Field


class AnalyticsSummary(BaseModel):
    total_courses: int = 0
    completed_courses: int = 0
    active_courses: int = 0
    overall_progress: int = 0
    lessons_completed: int = 0
    lessons_started: int = 0
    quiz_attempts: int = 0
    average_quiz_score: float = 0.0
    best_quiz_score: float = 0.0


class CourseAnalyticsItem(BaseModel):
    course_id: int
    title: str
    progress: int
    completed_lessons: int
    total_lessons: int
    completed: bool
    next_lesson_id: int | None = None
    next_lesson_title: str | None = None


class QuizPerformanceItem(BaseModel):
    quiz_id: int
    quiz_title: str
    course_id: int
    course_title: str
    attempts: int
    average_percentage: float
    best_percentage: float
    last_attempt_at: datetime | None = None


class ActivityEvent(BaseModel):
    event_type: str
    description: str
    timestamp: datetime


class StudentAnalyticsResponse(BaseModel):
    summary: AnalyticsSummary = Field(default_factory=AnalyticsSummary)
    courses: list[CourseAnalyticsItem] = Field(default_factory=list)
    quiz_performance: list[QuizPerformanceItem] = Field(default_factory=list)
    recent_activity: list[ActivityEvent] = Field(default_factory=list)


# --------------------------------------------------------------------------
# Instructor course analytics
# --------------------------------------------------------------------------


class InstructorCourseSummary(BaseModel):
    course_id: int
    course_title: str
    published: bool
    total_enrolled: int = 0
    active_students: int = 0
    completed_students: int = 0
    average_progress: float = 0.0
    completion_rate: float = 0.0
    total_lessons: int = 0
    completed_lesson_activity: int = 0
    total_quiz_attempts: int = 0
    average_quiz_score: float = 0.0


class CourseProgressBucket(BaseModel):
    bucket: str
    students: int


class CourseProgressInfo(BaseModel):
    total_enrolled: int = 0
    average_progress: float = 0.0
    min_progress: int = 0
    max_progress: int = 0
    completed_students: int = 0
    active_students: int = 0
    completion_percentage: float = 0.0
    progress_buckets: list[CourseProgressBucket] = Field(default_factory=list)


class LessonAnalyticsItem(BaseModel):
    lesson_id: int
    lesson_title: str
    module_title: str
    total_enrolled_students: int = 0
    students_started: int = 0
    students_completed: int = 0
    completion_percentage: float = 0.0


class QuizAnalyticsItem(BaseModel):
    quiz_id: int
    quiz_title: str
    lesson_title: str
    total_attempts: int = 0
    unique_students: int = 0
    average_score: float = 0.0
    best_score: float = 0.0
    lowest_score: float = 0.0
    completion_rate: float = 0.0


class StudentPerformanceItem(BaseModel):
    student_id: int
    student_name: str
    student_email: str
    course_progress: int = 0
    lessons_completed: int = 0
    total_lessons: int = 0
    quiz_attempts: int = 0
    average_quiz_score: float = 0.0
    last_activity: datetime | None = None
    completed: bool = False


class InstructorActivityEvent(BaseModel):
    event_type: str
    student_name: str
    description: str
    timestamp: datetime


class InstructorCourseAnalytics(BaseModel):
    course_id: int
    course_title: str
    published: bool
    summary: InstructorCourseSummary = Field(default_factory=InstructorCourseSummary)
    progress: CourseProgressInfo = Field(default_factory=CourseProgressInfo)
    lesson_analytics: list[LessonAnalyticsItem] = Field(default_factory=list)
    quiz_analytics: list[QuizAnalyticsItem] = Field(default_factory=list)
    student_performance: list[StudentPerformanceItem] = Field(default_factory=list)
    recent_activity: list[InstructorActivityEvent] = Field(default_factory=list)


# --------------------------------------------------------------------------
# Admin platform analytics
# --------------------------------------------------------------------------


class AdminPlatformSummary(BaseModel):
    total_users: int = 0
    total_students: int = 0
    total_instructors: int = 0
    total_admins: int = 0
    total_courses: int = 0
    published_courses: int = 0
    unpublished_courses: int = 0
    total_enrollments: int = 0
    completed_enrollments: int = 0
    overall_course_progress: float = 0.0
    total_lessons: int = 0
    completed_lessons: int = 0
    total_quizzes: int = 0
    total_quiz_attempts: int = 0
    completed_quiz_attempts: int = 0
    average_quiz_score: float = 0.0


class AdminCourseItem(BaseModel):
    course_id: int
    course_title: str
    instructor_id: int
    instructor_name: str
    published: bool
    enrollment_count: int = 0
    completion_count: int = 0
    average_progress: float = 0.0
    lesson_count: int = 0
    quiz_count: int = 0
    quiz_attempts: int = 0
    average_quiz_score: float = 0.0


class RoleCountItem(BaseModel):
    role: str
    count: int = 0


class AdminAnalyticsResponse(BaseModel):
    summary: AdminPlatformSummary = Field(default_factory=AdminPlatformSummary)
    courses: list[AdminCourseItem] = Field(default_factory=list)
    role_distribution: list[RoleCountItem] = Field(default_factory=list)
    progress_distribution: list[CourseProgressBucket] = Field(default_factory=list)
    recent_activity: list[InstructorActivityEvent] = Field(default_factory=list)