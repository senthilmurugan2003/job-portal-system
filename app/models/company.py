from datetime import datetime

from app.extensions import db


class Company(db.Model):

    __tablename__ = "companies"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    recruiter_id = db.Column(
        db.Integer,
        db.ForeignKey("recruiters.id"),
        unique=True,
        nullable=False
    )

    company_name = db.Column(
        db.String(150),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    location = db.Column(
        db.String(100),
        nullable=True
    )

    website = db.Column(
        db.String(255),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )