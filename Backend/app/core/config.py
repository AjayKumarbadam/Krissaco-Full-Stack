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
    _raw_db_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/Krissaco",
    )
    if _raw_db_url.startswith("postgres://"):
        _raw_db_url = _raw_db_url.replace("postgres://", "postgresql://", 1)

    # Detect installed PostgreSQL driver (psycopg 3 vs psycopg2)
    _has_psycopg3 = False
    try:
        import psycopg  # noqa: F401
        _has_psycopg3 = True
    except ImportError:
        pass

    _has_psycopg2 = False
    try:
        import psycopg2  # noqa: F401
        _has_psycopg2 = True
    except ImportError:
        pass

    if _has_psycopg3:
        _driver = "postgresql+psycopg://"
    elif _has_psycopg2:
        _driver = "postgresql+psycopg2://"
    else:
        _driver = "postgresql://"

    if _raw_db_url.startswith("postgresql+psycopg://") and not _has_psycopg3 and _has_psycopg2:
        DATABASE_URL: str = _raw_db_url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
    elif _raw_db_url.startswith("postgresql://") and not (
        _raw_db_url.startswith("postgresql+psycopg://") or _raw_db_url.startswith("postgresql+psycopg2://")
    ):
        DATABASE_URL: str = _raw_db_url.replace("postgresql://", _driver, 1)
    else:
        DATABASE_URL: str = _raw_db_url

    # Security & Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "krissaco-jwt-production-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

    # CORS
    _raw_allowed: str = os.getenv("ALLOWED_ORIGINS", "").strip()
    if _raw_allowed:
        ALLOWED_ORIGINS: list[str] = [
            origin.strip()
            for origin in _raw_allowed.split(",")
            if origin.strip()
        ]
    else:
        ALLOWED_ORIGINS: list[str] = [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3000",
            "http://localhost:4173",
            "http://localhost:8080",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:4173",
            "http://127.0.0.1:8080",
        ]

    ALLOW_ORIGIN_REGEX: str | None = os.getenv("ALLOW_ORIGIN_REGEX", r"^https?://.*$")

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
