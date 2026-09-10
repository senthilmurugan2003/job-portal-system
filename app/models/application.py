from datetime import datetime

from app.extensions import db


class Application(db.Model):

    __tablename__ = "applications"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    job_id = db.Column(
        db.Integer,
        db.ForeignKey("jobs.id"),
        nullable=False
    )

    job_seeker_id = db.Column(
        db.Integer,
        db.ForeignKey("job_seekers.id"),
        nullable=False
    )

    cover_letter = db.Column(
        db.Text,
        nullable=True
    )

    status = db.Column(
        db.String(30),
        nullable=False,
        default="Applied"
    )

    applied_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    __table_args__ = (
        db.UniqueConstraint(
            "job_id",
            "job_seeker_id",
            name="unique_job_seeker_application"
        ),
    )