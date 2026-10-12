import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            print("=== MIGRATING STUDY PLAN TABLES ===")

            # 1. Create Enums if they do not exist
            conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE planstatus AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                END $$;
            """))

            conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE tasktype AS ENUM ('LESSON', 'QUIZ', 'REVIEW');
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                END $$;
            """))

            conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE taskpriority AS ENUM ('LOW', 'MEDIUM', 'HIGH');
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                END $$;
            """))

            conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE taskstatus AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                END $$;
            """))

            # 2. Create study_plans table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS study_plans (
                    id SERIAL PRIMARY KEY,
                    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    target_date DATE NOT NULL,
                    daily_minutes_goal INTEGER NOT NULL DEFAULT 30,
                    preferred_days JSONB,
                    status planstatus NOT NULL DEFAULT 'ACTIVE',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                );
            """))

            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_study_plans_student_id ON study_plans(student_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_study_plans_course_id ON study_plans(course_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_study_plans_status ON study_plans(status);"))

            # 3. Create study_plan_tasks table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS study_plan_tasks (
                    id SERIAL PRIMARY KEY,
                    study_plan_id INTEGER NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
                    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                    module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
                    lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
                    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE SET NULL,
                    task_type tasktype NOT NULL DEFAULT 'LESSON',
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    scheduled_date DATE NOT NULL,
                    estimated_minutes INTEGER NOT NULL DEFAULT 20,
                    priority taskpriority NOT NULL DEFAULT 'MEDIUM',
                    status taskstatus NOT NULL DEFAULT 'PENDING',
                    completed_at TIMESTAMP WITH TIME ZONE,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                );
            """))

            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_study_plan_tasks_plan_id ON study_plan_tasks(study_plan_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_study_plan_tasks_student_id ON study_plan_tasks(student_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_study_plan_tasks_scheduled_date ON study_plan_tasks(scheduled_date);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_study_plan_tasks_status ON study_plan_tasks(status);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_study_plan_tasks_student_lesson ON study_plan_tasks(student_id, lesson_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_study_plan_tasks_student_date ON study_plan_tasks(student_id, scheduled_date);"))

            trans.commit()
            print("[OK] Study plan tables and indexes created successfully!")
        except Exception as e:
            trans.rollback()
            print("[FAIL] Migration failed:", e)
            raise e

def verify():
    with engine.connect() as conn:
        tables = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN ('study_plans', 'study_plan_tasks')
            ORDER BY table_name;
        """)).fetchall()
        print("Verified tables in database:", [t[0] for t in tables])

if __name__ == "__main__":
    migrate()
    verify()
