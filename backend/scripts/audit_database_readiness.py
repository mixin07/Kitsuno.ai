import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, ".env"))

url = os.getenv("DATABASE_URL")
if not url.startswith("postgresql+psycopg://") and "postgresql" in url:
    url = url.replace("postgresql+asyncpg://", "postgresql+psycopg://").replace("postgresql://", "postgresql+psycopg://")

engine = create_engine(url)

print("=" * 60)
print("DATABASE & RLS READINESS AUDIT")
print("=" * 60)

with engine.connect() as conn:
    # 1. Check RLS status
    print("\n--- Row Level Security (RLS) Status on public tables ---")
    rows = conn.execute(text("""
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename;
    """)).fetchall()
    
    rls_enabled_tables = []
    rls_disabled_tables = []
    for table, rls in rows:
        status_str = "ENABLED" if rls else "DISABLED"
        print(f"  {table:<28} : RLS {status_str}")
        if rls:
            rls_enabled_tables.append(table)
        else:
            rls_disabled_tables.append(table)
            
    print(f"\nSummary: {len(rls_enabled_tables)} tables with RLS enabled, {len(rls_disabled_tables)} tables with RLS disabled.")

    # 2. Check existing policies if any
    print("\n--- Existing Policies on public tables ---")
    policies = conn.execute(text("""
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies
        WHERE schemaname = 'public';
    """)).fetchall()
    if not policies:
        print("  None found (No RLS policies defined in public schema).")
    else:
        for p in policies:
            print(f"  {p.tablename} -> {p.policyname} ({p.cmd})")

    # 3. Check baseline entities
    print("\n--- Baseline Users Verification ---")
    users = conn.execute(text("""
        SELECT id, email, role, approval_status, requested_role
        FROM public.users
        ORDER BY id;
    """)).mappings().fetchall()
    for u in users:
        print(f"  User ID {u['id']:<5} : {u['email']:<28} [{u['role']}] - Status: {u['approval_status']}")

    print("\n--- Baseline Courses Catalog ---")
    courses = conn.execute(text("""
        SELECT id, title, instructor_id, published
        FROM public.courses
        ORDER BY id;
    """)).mappings().fetchall()
    for c in courses:
        print(f"  Course ID {c['id']:<5} : {c['title']:<45} (Instructor: {c['instructor_id']})")

    print("\n--- Curriculum Entity Counts ---")
    for tbl in ["courses", "modules", "lessons", "quizzes", "questions", "options"]:
        cnt = conn.execute(text(f"SELECT count(*) FROM public.{tbl}")).scalar()
        print(f"  {tbl:<12} : {cnt}")
