from datetime import datetime

from app.extensions import db


class JobSeeker(db.Model):

    __tablename__ = "job_seekers"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    phone = db.Column(
        db.String(20),
        nullable=True
    )

    location = db.Column(
        db.String(100),
        nullable=True
    )

    qualification = db.Column(
        db.String(150),
        nullable=True
    )

    experience = db.Column(
        db.String(100),
        nullable=True
    )

    bio = db.Column(
        db.Text,
        nullable=True
    )

    resume_path = db.Column(
        db.String(255),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )