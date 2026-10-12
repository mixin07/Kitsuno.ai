import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from sqlalchemy import text
from app.database import engine

def main():
    with engine.connect() as conn:
        print("Connected to database successfully!")
        
        # Check schemas
        schemas = conn.execute(text("SELECT schema_name FROM information_schema.schemata")).fetchall()
        print("Schemas:", [s[0] for s in schemas])
        
        # Check tables in auth schema
        auth_tables = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth'")).fetchall()
        print("Auth tables:", [t[0] for t in auth_tables])

        # Check triggers in auth schema
        triggers = conn.execute(text("""
            SELECT trigger_name, event_manipulation, event_object_table, action_statement
            FROM information_schema.triggers
            WHERE event_object_schema = 'auth'
        """)).fetchall()
        print("\nTriggers on auth tables:")
        for t in triggers:
            print(" ", t)

        # Inspect auth.instances
        try:
            insts = conn.execute(text("SELECT * FROM auth.instances")).fetchall()
            print("auth.instances:", insts)
        except Exception as e:
            print("auth.instances err:", e)
        res = conn.execute(text("""
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name = 'users'
        """)).fetchall()
        print("Tables named users:", res)

        # Inspect columns of public.users
        cols = conn.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'users'
            ORDER BY ordinal_position
        """)).fetchall()
        print("\nColumns in public.users:")
        for c in cols:
            print(" ", c)

        # Query all public.users
        users = conn.execute(text("""
            SELECT id, name, email, role, is_active, created_at, updated_at, avatar_url,
                   SUBSTRING(password_hash FROM 1 FOR 7) as hash_prefix
            FROM public.users
            ORDER BY id
        """)).fetchall()
        print(f"\nTotal public.users count: {len(users)}")
        print("\n--- Non-test users (Candidate retained users) ---")
        retained = []
        for u in users:
            if not u[2].endswith('@test.com'):
                retained.append(u)
                uid = u[0]
                lp = conn.execute(text('SELECT count(*) FROM lesson_progress WHERE student_id = :uid'), {'uid': uid}).scalar()
                qa = conn.execute(text('SELECT count(*) FROM quiz_attempts WHERE student_id = :uid'), {'uid': uid}).scalar()
                en = conn.execute(text('SELECT count(*) FROM enrollments WHERE student_id = :uid'), {'uid': uid}).scalar()
                cr = conn.execute(text('SELECT count(*) FROM courses WHERE instructor_id = :uid'), {'uid': uid}).scalar()
                gm = conn.execute(text('SELECT count(*) FROM user_gamification WHERE user_id = :uid'), {'uid': uid}).scalar()
                sc = conn.execute(text('SELECT count(*) FROM saved_courses WHERE user_id = :uid'), {'uid': uid}).scalar()
                sl = conn.execute(text('SELECT count(*) FROM saved_lessons WHERE user_id = :uid'), {'uid': uid}).scalar()
                sn = conn.execute(text('SELECT count(*) FROM saved_notes WHERE user_id = :uid'), {'uid': uid}).scalar()
                print(f" ID: {u[0]} | Email: {u[2]} | Name: {u[1]} | Role: {u[3]} | Active: {u[4]} | Created: {u[5]} | HashPrefix: {u[8]}")
                print(f"    Data: courses={cr}, enrollments={en}, progress={lp}, quizzes={qa}, gamification={gm}, saved(c={sc}, l={sl}, n={sn})")
        print("\n--- Test users (@test.com) ---")
        for u in users:
            if u[2].endswith('@test.com'):
                print(f" ID: {u[0]} | Email: {u[2]} | Role: {u[3]} | Created: {u[5]}")

        # Check if auth_user_id column exists
        has_auth_user_id = any(c[0] == 'auth_user_id' for c in cols)
        print(f"\nauth_user_id column exists in public.users: {has_auth_user_id}")

        # Check auth.users table if it exists
        try:
            auth_users = conn.execute(text("""
                SELECT id, email, created_at, encrypted_password IS NOT NULL as has_enc_pass
                FROM auth.users
                ORDER BY created_at
            """)).fetchall()
            print(f"\nTotal auth.users count: {len(auth_users)}")
            for au in auth_users:
                print(" ", au)
        except Exception as e:
            print("\nCould not query auth.users:", e)

        # Check all foreign keys referencing public.users
        fks = conn.execute(text("""
            SELECT
                tc.table_schema, 
                tc.table_name, 
                kcu.column_name, 
                ccu.table_schema AS foreign_table_schema,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND ccu.table_name = 'users'
        """)).fetchall()
        print(f"\nForeign keys referencing users: {len(fks)}")
        for fk in fks:
            print(" ", fk)

if __name__ == "__main__":
    main()
