import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings:
    PROJECT_NAME: str = "Krissaco Transaction Management & Audit System"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/Krissaco",
    )
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

    # Security & Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "krissaco-jwt-production-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174",
        ).split(",")
        if origin.strip()
    ]

    # File Storage
    UPLOAD_DIR: Path = BASE_DIR / "static" / "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_UPLOAD_EXTENSIONS: set[str] = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}

    # Business Validation Constants
    MIN_VENDOR_LEN: int = 2
    MAX_VENDOR_LEN: int = 150
    MIN_DESC_LEN: int = 3
    MAX_DESC_LEN: int = 255
    DATE_FORMAT: str = "%d-%m-%Y"


settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
