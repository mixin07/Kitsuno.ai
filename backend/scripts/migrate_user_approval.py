import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import engine
from sqlalchemy import text, inspect

def run_migration():
    print("Running migration for user approval status...")
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'APPROVED' NOT NULL;"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS requested_role VARCHAR(50) NULL;"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE NULL;"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;"))
        
        # Ensure any existing users have approval_status = 'APPROVED'
        conn.execute(text("UPDATE users SET approval_status = 'APPROVED' WHERE approval_status IS NULL;"))
        conn.commit()

    insp = inspect(engine)
    cols = [c['name'] for c in insp.get_columns('users')]
    print("Current columns on users table:", cols)
    print("Migration completed successfully.")

if __name__ == "__main__":
    run_migration()
