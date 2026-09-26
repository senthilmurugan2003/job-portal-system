from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User, Recruiter, Company, Job
from app.utils.auth import recruiter_required
jobs_bp = Blueprint(
    "jobs",
    __name__,
    url_prefix="/api/jobs"
)


@jobs_bp.route("", methods=["POST"])
@jwt_required()
def create_job():

    user_id = int(get_jwt_identity())

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

    data = request.get_json() or {}

    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    location = (data.get("location") or "").strip()
    salary = data.get("salary")
    experience = data.get("experience")
    job_type = data.get("job_type")
    skills = data.get("skills")

    if not title or not description or not location or not job_type:
        return jsonify({
            "message": "Title, description, location and job type are required"
        }), 400

    # Prevent duplicate job post creation (e.g. rapid double-clicks / repeated submissions)
    from datetime import datetime, timedelta
    cutoff_time = datetime.utcnow() - timedelta(seconds=10)
    existing_duplicate = Job.query.filter(
        Job.company_id == company.id,
        Job.title == title,
        Job.location == location,
        Job.job_type == job_type,
        Job.created_at >= cutoff_time
    ).first()

    if existing_duplicate:
        return jsonify({
            "message": "Job created successfully",
            "job": {
                "id": existing_duplicate.id,
                "title": existing_duplicate.title,
                "company_id": existing_duplicate.company_id,
                "location": existing_duplicate.location,
                "job_type": existing_duplicate.job_type,
                "status": existing_duplicate.status
            }
        }), 200

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



@jobs_bp.route("/recruiter", methods=["GET"])
@jwt_required()
def get_recruiter_jobs():
    user = recruiter_required()
    if not user:
        return jsonify({"message": "Recruiter access required"}), 403

    recruiter = Recruiter.query.filter_by(user_id=user.id).first()
    if not recruiter:
        return jsonify([]), 200

    company = Company.query.filter_by(recruiter_id=recruiter.id).first()
    if not company:
        return jsonify([]), 200

    jobs = Job.query.filter_by(company_id=company.id).order_by(Job.created_at.desc()).all()
    result = []
    for job in jobs:
        result.append({
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "company": company.company_name,
            "location": job.location,
            "salary": job.salary,
            "experience": job.experience,
            "job_type": job.job_type,
            "skills": job.skills,
            "status": job.status,
            "created_at": job.created_at
        })

    return jsonify(result), 200


@jobs_bp.route("/<int:id>", methods=["GET"])
def get_job(id):

    job = Job.query.get(id)

    if not job:
        return jsonify({
            "message":"Job not found"
        }),404


    return jsonify({

        "id":job.id,
        "title":job.title,
        "description":job.description,
        "location":job.location,
        "salary":job.salary,
        "experience":job.experience,
        "job_type":job.job_type,
        "skills":job.skills,
        "status":job.status

    }),200
@jobs_bp.route("", methods=["GET"])
def get_jobs():

    jobs = Job.query.filter_by(status="open").order_by(Job.created_at.desc()).all()


    result = []


    for job in jobs:


        company = Company.query.get(
            job.company_id
        )


        result.append({

            "id": job.id,

            "title": job.title,

            "description": job.description,


            "company":
                company.company_name
                if company
                else "Unknown",


            "location": job.location,

            "salary": job.salary,

            "experience": job.experience,

            "job_type": job.job_type,

            "skills": job.skills,

            "status": job.status


        })


    return jsonify(result),200


@jobs_bp.route("/<int:id>/close", methods=["PUT"])
@jwt_required()
def close_job(id):
    user = recruiter_required()
    if not user:
        return jsonify({"message": "Recruiter access required"}), 403

    job = Job.query.get(id)
    if not job:
        return jsonify({"message": "Job not found"}), 404

    recruiter = Recruiter.query.filter_by(user_id=user.id).first()
    company = Company.query.filter_by(recruiter_id=recruiter.id).first() if recruiter else None

    if not company or job.company_id != company.id:
        return jsonify({"message": "You are not authorized to close this job"}), 403

    job.status = "closed"
    db.session.commit()

    return jsonify({"message": "Applications closed successfully"}), 200
@jobs_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_job(id):

    user = recruiter_required()


    if not user:
        return jsonify({
            "message":"Recruiter access required"
        }),403


    job = Job.query.get(id)


    if not job:
        return jsonify({
            "message":"Job not found"
        }),404


    recruiter = Recruiter.query.filter_by(
        user_id=user.id
    ).first()


    company = Company.query.filter_by(
        recruiter_id=recruiter.id
    ).first()


    if job.company_id != company.id:

        return jsonify({
            "message":"You cannot edit this job"
        }),403



    data=request.get_json()


    job.title = data.get(
        "title",
        job.title
    )


    job.description=data.get(
        "description",
        job.description
    )


    job.salary=data.get(
        "salary",
        job.salary
    )


    db.session.commit()


    return jsonify({
        "message":"Job updated successfully"
    }),200
@jobs_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_job(id):

    user = recruiter_required()


    if not user:
        return jsonify({
            "message":"Recruiter access required"
        }),403


    job = Job.query.get(id)


    if not job:
        return jsonify({
            "message":"Job not found"
        }),404


    recruiter = Recruiter.query.filter_by(
        user_id=user.id
    ).first()


    company = Company.query.filter_by(
        recruiter_id=recruiter.id
    ).first()


    if job.company_id != company.id:

        return jsonify({
            "message":"You cannot delete this job"
        }),403


    db.session.delete(job)

    db.session.commit()


    return jsonify({
        "message":"Job deleted successfully"
    }),200