import sys
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import engine, SessionLocal
from app.services.search_service import search_learning_content
from sqlalchemy import text

def verify():
    # 1. Check courses
    with engine.connect() as conn:
        courses = conn.execute(text("SELECT id, title, published, instructor_id FROM courses ORDER BY id")).fetchall()
        print(f"=== TOTAL PRODUCTION COURSES: {len(courses)} ===")
        for idx, c in enumerate(courses, 1):
            print(f"  {idx}. [ID {c[0]:4d}] {c[1]} (Published: {c[2]}, Instructor: {c[3]})")
    
    # 2. Check AI search
    print("\n=== AI SEARCH VERIFICATION ===")
    db = SessionLocal()
    try:
        for query in ["admin", "test course", "analytics test", "javascript", "react", "python", "java"]:
            res = search_learning_content(db, query)
            print(f"  Query '{query}': {res.total_results} results found")
            for r in res.results[:2]:
                print(f"    -> [{r.content_type}] {r.title} ({r.action_url})")
    finally:
        db.close()

if __name__ == "__main__":
    verify()
