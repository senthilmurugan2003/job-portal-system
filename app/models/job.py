from datetime import datetime

from app.extensions import db


class Job(db.Model):

    __tablename__ = "jobs"


    id = db.Column(
        db.Integer,
        primary_key=True
    )


    company_id = db.Column(
        db.Integer,
        db.ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )


    title = db.Column(
        db.String(150),
        nullable=False
    )


    description = db.Column(
        db.Text,
        nullable=False
    )


    location = db.Column(
        db.String(100),
        nullable=False
    )


    salary = db.Column(
        db.String(100),
        nullable=True
    )


    experience = db.Column(
        db.String(100),
        nullable=True
    )


    job_type = db.Column(
        db.String(50),
        nullable=False
    )


    skills = db.Column(
        db.Text,
        nullable=True
    )


    status = db.Column(
        db.String(20),
        nullable=False,
        default="open",
        index=True
    )


    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )


    # Company relationship
    company = db.relationship(
        "Company",
        backref="jobs"
    )

    # Applications relationship
    applications = db.relationship(
        "Application",
        backref="job",
        cascade="all, delete-orphan"
    )