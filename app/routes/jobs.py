from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import User, Recruiter, Company, Job


jobs_bp = Blueprint(
    "jobs",
    __name__,
    url_prefix="/api/jobs"
)


@jobs_bp.route("", methods=["POST"])
@jwt_required()
def create_job():

    user_id = get_jwt_identity()

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if user.role != "recruiter":
        return jsonify({
            "message": "Only recruiters can create jobs"
        }), 403

    recruiter = Recruiter.query.filter_by(
        user_id=user.id
    ).first()

    if not recruiter:
        return jsonify({
            "message": "Recruiter profile not found"
        }), 404

    company = Company.query.filter_by(
        recruiter_id=recruiter.id
    ).first()

    if not company:
        return jsonify({
            "message": "Company profile not found"
        }), 404

    data = request.get_json()

    title = data.get("title")
    description = data.get("description")
    location = data.get("location")
    salary = data.get("salary")
    experience = data.get("experience")
    job_type = data.get("job_type")
    skills = data.get("skills")

    if not title or not description or not location or not job_type:
        return jsonify({
            "message": "Title, description, location and job type are required"
        }), 400

    job = Job(
        company_id=company.id,
        title=title,
        description=description,
        location=location,
        salary=salary,
        experience=experience,
        job_type=job_type,
        skills=skills
    )

    db.session.add(job)
    db.session.commit()

    return jsonify({
        "message": "Job created successfully",
        "job": {
            "id": job.id,
            "title": job.title,
            "company_id": job.company_id,
            "location": job.location,
            "job_type": job.job_type,
            "status": job.status
        }
    }), 201