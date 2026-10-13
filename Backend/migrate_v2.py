import psycopg
import bcrypt

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def migrate():
    conn = psycopg.connect("postgresql://postgres:postgres@localhost:5432/Krissaco", autocommit=True)
    cur = conn.cursor()
    
    print("Running v2.0 schema updates...")
    
    # 1. Create users table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """)
    print("users table checked/created.")

    # 2. Seed initial users if empty
    users_to_seed = [
        ("accountant@krissaco.com", hash_password("accountant123"), "Alice Accountant", "Accountant"),
        ("manager@krissaco.com", hash_password("manager123"), "Bob Manager", "Manager"),
        ("auditor@krissaco.com", hash_password("auditor123"), "Carol Auditor", "Auditor"),
    ]
    for username, pwd_hash, full_name, role in users_to_seed:
        cur.execute("""
        INSERT INTO users (username, password_hash, full_name, role)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (username) DO UPDATE 
        SET password_hash = EXCLUDED.password_hash,
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role;
        """, (username, pwd_hash, full_name, role))
    print("Seed users created/updated.")

    # 3. Add columns to transaction table if not exist
    cols = [
        ('Status', "VARCHAR(30) DEFAULT 'Pending' NOT NULL"),
        ('CreatedBy', "VARCHAR(100) DEFAULT 'accountant@krissaco.com'"),
        ('CreatedByName', "VARCHAR(150) DEFAULT 'Alice Accountant'"),
        ('ReceiptURL', "VARCHAR(500)"),
        ('ApprovedBy', "VARCHAR(100)"),
        ('ApprovedByName', "VARCHAR(150)"),
        ('ApprovedAt', "TIMESTAMP WITH TIME ZONE"),
        ('RejectionReason', "VARCHAR(500)"),
    ]
    
    for col_name, col_type in cols:
        cur.execute(f"""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name='transaction' AND column_name='{col_name}'
            ) THEN
                ALTER TABLE "transaction" ADD COLUMN "{col_name}" {col_type};
            END IF;
        END $$;
        """)
    print("transaction columns updated.")

    # 4. Create audit_logs table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(100),
        action VARCHAR(50) NOT NULL,
        actor_username VARCHAR(100) NOT NULL,
        actor_name VARCHAR(150) NOT NULL,
        actor_role VARCHAR(50) NOT NULL,
        details TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """)
    print("audit_logs table checked/created.")

    cur.close()
    conn.close()
    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
