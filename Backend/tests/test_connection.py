from app.core.database import engine

def test_connection():
    try:
        with engine.connect() as conn:
            print("✅ Connected to Supabase successfully!")
            assert True
    except Exception as e:
        print("❌ Connection failed:", e)
        assert False, f"Connection failed: {e}"