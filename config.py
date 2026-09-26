import os
from datetime import timedelta
from dotenv import load_dotenv


load_dotenv()


class Config:

    SECRET_KEY = os.getenv("SECRET_KEY", "default-job-portal-secret-key-2026-super-secure-key-32bytes")

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