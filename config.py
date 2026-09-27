import os
from datetime import timedelta
from dotenv import load_dotenv


load_dotenv()


class Config:

    SECRET_KEY = os.getenv("SECRET_KEY")   

    _raw_db_url = os.getenv(
        "DATABASE_URL",
        "sqlite:///job_portal_db.db"
    )
    if _raw_db_url and _raw_db_url.startswith("postgres://"):
        _raw_db_url = _raw_db_url.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_DATABASE_URI = _raw_db_url

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv(
        "JWT_SECRET_KEY",
        "default-jwt-secret-key-2026-super-secure-key-32bytes"
    )

    # JWT Access Token Expiry duration (24 Hours)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # Email SMTP Configuration
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True").lower() in ("true", "1", "t", "yes")
    MAIL_DEFAULT_SENDER = os.getenv("MAIL_DEFAULT_SENDER", "Job Portal <noreply@jobportal.com>")

    # Frontend URL for links (Password reset, etc.)
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:5500/frontend")