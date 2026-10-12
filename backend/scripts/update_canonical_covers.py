"""
Update database thumbnail_url for the 9 canonical courses to use
the newly generated Kitsuno editorial SVG covers.
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app.models.course import Course

CANONICAL_COVERS_MAP = {
    3897: "/covers/html.svg",
    3898: "/covers/css.svg",
    3899: "/covers/javascript.svg",
    3900: "/covers/react.svg",
    2474: "/covers/fullstack.svg",
    5611: "/covers/java.svg",
    5612: "/covers/mongodb.svg",
    5613: "/covers/c.svg",
    5614: "/covers/python.svg",
}

def update_covers():
    db = SessionLocal()
    try:
        courses = db.query(Course).filter(Course.published == True).order_by(Course.id).all()
        print(f"Auditing {len(courses)} published courses...")
        
        updated_count = 0
        for course in courses:
            if course.id in CANONICAL_COVERS_MAP:
                new_cover = CANONICAL_COVERS_MAP[course.id]
                old_cover = course.thumbnail_url
                course.thumbnail_url = new_cover
                updated_count += 1
                print(f"[UPDATED] Course ID {course.id} ({course.title}):")
                print(f"          Old: {old_cover}")
                print(f"          New: {new_cover}")
        
        db.commit()
        print(f"\nSuccessfully committed {updated_count} canonical course cover updates to database.")
    except Exception as e:
        db.rollback()
        print(f"Error updating course covers: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    update_covers()
