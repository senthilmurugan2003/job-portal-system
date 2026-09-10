from datetime import datetime

from app.extensions import db


class Recruiter(db.Model):

    __tablename__ = "recruiters"

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

    designation = db.Column(
        db.String(100),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )