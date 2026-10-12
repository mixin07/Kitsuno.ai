import sys
import uuid
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import engine
from sqlalchemy import text

RETAINED_EMAILS = [
    "sm7510@srmist.edu.in",  # Shahid (INSTRUCTOR)
    "mj0971@gmail.com",       # Mikasa (STUDENT)
]

def migrate():
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            print("=== PHASE 1: DATABASE SCHEMA MIGRATION ===")
            
            # 1. Check if auth_user_id exists on public.users
            cols = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'auth_user_id'
            """)).fetchall()
            
            if not cols:
                print("Adding 'auth_user_id' column to public.users...")
                conn.execute(text("""
                    ALTER TABLE public.users 
                    ADD COLUMN auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;
                """))
                print("Column 'auth_user_id' added successfully.")
            else:
                print("Column 'auth_user_id' already exists.")

            # 2. Make password_hash nullable on public.users
            print("Altering public.users.password_hash to DROP NOT NULL...")
            conn.execute(text("""
                ALTER TABLE public.users 
                ALTER COLUMN password_hash DROP NOT NULL;
            """))
            print("Column 'password_hash' altered to nullable.")

            # 3. Create index on auth_user_id if not present
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_users_auth_user_id ON public.users(auth_user_id);
            """))

            print("\n=== PHASE 2: RETAINED USERS MIGRATION TO auth.users ===")
            
            for email in RETAINED_EMAILS:
                user = conn.execute(text("""
                    SELECT id, name, email, password_hash, role, is_active
                    FROM public.users
                    WHERE email = :email
                """), {"email": email}).fetchone()
                
                if not user:
                    print(f"WARNING: Retained user {email} not found in public.users!")
                    continue
                
                uid, name, user_email, password_hash, role, is_active = user
                print(f"\nProcessing user {user_email} (public.users ID: {uid}, Role: {role}):")
                
                # Check if auth.users record already exists
                existing_auth = conn.execute(text("""
                    SELECT id FROM auth.users WHERE email = :email
                """), {"email": user_email}).fetchone()
                
                if existing_auth:
                    auth_id = existing_auth[0]
                    print(f"  auth.users record already exists with ID: {auth_id}")
                else:
                    auth_id = str(uuid.uuid4())
                    print(f"  Creating auth.users record with ID: {auth_id}...")
                    conn.execute(text("""
                        INSERT INTO auth.users (
                            id, instance_id, aud, role, email, encrypted_password,
                            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                            created_at, updated_at
                        ) VALUES (
                            CAST(:id_uuid AS uuid),
                            '00000000-0000-0000-0000-000000000000'::uuid,
                            'authenticated',
                            'authenticated',
                            CAST(:email AS text),
                            CAST(:password_hash AS text),
                            NOW(),
                            '{"provider": "email", "providers": ["email"]}'::jsonb,
                            jsonb_build_object('name', CAST(:name AS text)),
                            NOW(),
                            NOW()
                        )
                    """), {
                        "id_uuid": auth_id,
                        "email": user_email,
                        "password_hash": password_hash,
                        "name": name,
                    })
                    print("  Created in auth.users.")
                    
                    # Create identity in auth.identities
                    conn.execute(text("""
                        INSERT INTO auth.identities (
                            id, provider_id, user_id, identity_data, provider,
                            last_sign_in_at, created_at, updated_at
                        ) VALUES (
                            gen_random_uuid(),
                            CAST(:id_str AS text),
                            CAST(:id_uuid AS uuid),
                            jsonb_build_object('sub', CAST(:id_str AS text), 'email', CAST(:email AS text)),
                            'email',
                            NOW(),
                            NOW(),
                            NOW()
                        )
                    """), {
                        "id_str": auth_id,
                        "id_uuid": uuid.UUID(auth_id),
                        "email": user_email,
                    })
                    print("  Created in auth.identities.")

                # Link public.users.auth_user_id
                conn.execute(text("""
                    UPDATE public.users
                    SET auth_user_id = CAST(:auth_id AS uuid)
                    WHERE id = :uid
                """), {"auth_id": str(auth_id), "uid": uid})
                print(f"  Linked public.users(id={uid}).auth_user_id -> {auth_id}")

            trans.commit()
            print("\n[OK] Migration committed successfully!")

        except Exception as e:
            trans.rollback()
            print("\n[FAIL] Migration FAILED, rolled back:", e)
            raise e

def verify():
    with engine.connect() as conn:
        print("\n=== VERIFICATION OF MIGRATION RESULTS ===")
        users = conn.execute(text("""
            SELECT id, name, email, role, auth_user_id, is_active
            FROM public.users
            ORDER BY id
        """)).fetchall()
        
        print(f"Total public.users: {len(users)}")
        for u in users:
            auth_status = f"auth_user_id={u[4]}" if u[4] else "UNMAPPED (EXCLUDED)"
            print(f"  ID: {u[0]:<4} | Email: {u[2]:<25} | Role: {u[3]:<10} | {auth_status}")

        auth_users = conn.execute(text("""
            SELECT id, email, created_at, email_confirmed_at IS NOT NULL as confirmed
            FROM auth.users
            ORDER BY created_at
        """)).fetchall()
        print(f"\nTotal auth.users: {len(auth_users)}")
        for au in auth_users:
            print(f"  ID: {au[0]} | Email: {au[1]} | Confirmed: {au[3]}")

if __name__ == "__main__":
    migrate()
    verify()
