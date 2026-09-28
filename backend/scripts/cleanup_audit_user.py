import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app.models import (
    User,
    Enrollment,
    LessonProgress,
    QuizAttempt,
    AttemptAnswer,
    GamificationLog,
    UserGamification,
    UserQuestProgress,
    UserAchievement,
    GameAttempt,
)
from sqlalchemy import select

def cleanup(email: str):
    with SessionLocal() as session:
        user = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if not user:
            print(f"  Cleanup: User {email} not found, nothing to clean.")
            return

        # Delete attempts and answers
        attempts = session.execute(select(QuizAttempt).where(QuizAttempt.student_id == user.id)).scalars().all()
        for a in attempts:
            answers = session.execute(select(AttemptAnswer).where(AttemptAnswer.attempt_id == a.id)).scalars().all()
            for ans in answers:
                session.delete(ans)
            session.delete(a)
        
        # Delete progress
        progress = session.execute(select(LessonProgress).where(LessonProgress.student_id == user.id)).scalars().all()
        for p in progress:
            session.delete(p)
            
        # Delete enrollments
        enrollments = session.execute(select(Enrollment).where(Enrollment.student_id == user.id)).scalars().all()
        for e in enrollments:
            session.delete(e)
            
        # Delete gamification records if any
        for model in [GamificationLog, UserQuestProgress, UserAchievement, GameAttempt, UserGamification]:
            records = session.execute(select(model).where(model.user_id == user.id)).scalars().all()
            for r in records:
                session.delete(r)

        session.delete(user)
        session.commit()
        print(f"  Cleanup: Successfully purged user {email} and associated data.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cleanup(sys.argv[1])
    else:
        print("Usage: python cleanup_audit_user.py <email>")
