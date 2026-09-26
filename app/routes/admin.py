from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from app.extensions import db

from app.models import (
    User,
    Job,
    Company,
    Application,
    Recruiter
)

from app.utils.admin import check_admin


admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin"
)


# ==========================
# ADMIN DASHBOARD
# ==========================

@admin_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():

    admin = check_admin()

    if not admin:
        return jsonify({
            "message": "Admin access required"
        }), 403


    return jsonify({

        "total_users": User.query.count(),

        "total_jobs": Job.query.count(),

        "total_companies": Company.query.count(),

        "total_applications": Application.query.count()

    }), 200



# ==========================
# GET ALL USERS
# ==========================

@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def get_users():

    if not check_admin():

        return jsonify({
            "message": "Admin access required"
        }), 403


    users = User.query.all()


    result = []

    for user in users:

        result.append({

            "id": user.id,

            "name": user.name,

            "email": user.email,

            "role": user.role

        })


    return jsonify(result), 200



# ==========================
# GET ALL RECRUITERS
# ==========================

@admin_bp.route("/recruiters", methods=["GET"])
@jwt_required()
def get_recruiters():

    if not check_admin():

        return jsonify({
            "message": "Admin access required"
        }),403


    recruiters = Recruiter.query.all()


    result = []


    for recruiter in recruiters:

        result.append({

            "id": recruiter.id,

            "user_id": recruiter.user_id,

            "phone": recruiter.phone,

            "designation": recruiter.designation

        })


    return jsonify(result),200



# ==========================
# GET ALL COMPANIES
# ==========================

@admin_bp.route("/companies", methods=["GET"])
@jwt_required()
def get_companies():

    if not check_admin():

        return jsonify({
            "message":"Admin access required"
        }),403



    companies = Company.query.all()


    result=[]


    for company in companies:

        result.append({

            "id":company.id,

            "company_name":company.company_name,

            "location":company.location,

            "website":company.website

        })


    return jsonify(result),200



# ==========================
# GET ALL JOBS
# ==========================

@admin_bp.route("/jobs", methods=["GET"])
@jwt_required()
def get_jobs():

    if not check_admin():

        return jsonify({
            "message":"Admin access required"
        }),403



    jobs = Job.query.all()


    result=[]


    for job in jobs:

        result.append({

            "id":job.id,

            "title":job.title,

            "location":job.location,

            "status":job.status

        })


    return jsonify(result),200



# ==========================
# DELETE JOB
# ==========================

@admin_bp.route("/jobs/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_job(id):

    if not check_admin():

        return jsonify({
            "message":"Admin access required"
        }),403



    job = Job.query.get(id)



    if not job:

        return jsonify({
            "message":"Job not found"
        }),404



    db.session.delete(job)

    db.session.commit()



    return jsonify({

        "message":"Job deleted successfully"

    }),200


# ==========================
# DELETE USER
# ==========================

@admin_bp.route("/users/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_user(id):
    if not check_admin():
        return jsonify({"message": "Admin access required"}), 403

    user = User.query.get(id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.role == "admin":
        return jsonify({"message": "Cannot delete admin user"}), 400

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"}), 200


# ==========================
# DELETE COMPANY
# ==========================

@admin_bp.route("/companies/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_company(id):
    if not check_admin():
        return jsonify({"message": "Admin access required"}), 403

    company = Company.query.get(id)
    if not company:
        return jsonify({"message": "Company not found"}), 404

    db.session.delete(company)
    db.session.commit()
    return jsonify({"message": "Company deleted successfully"}), 200


# ==========================
# GET ALL APPLICATIONS
# ==========================

@admin_bp.route("/applications", methods=["GET"])
@jwt_required()
def get_applications():
    if not check_admin():
        return jsonify({"message": "Admin access required"}), 403

    applications = Application.query.order_by(Application.applied_at.desc()).all()
    result = []
    for app in applications:
        job = Job.query.get(app.job_id)
        result.append({
            "id": app.id,
            "job_id": app.job_id,
            "job_title": job.title if job else "Unknown",
            "job_seeker_id": app.job_seeker_id,
            "status": app.status,
            "applied_at": app.applied_at
        })
    return jsonify(result), 200


# ==========================
# EDIT USER
# ==========================

@admin_bp.route("/users/<int:id>", methods=["PUT"])
@jwt_required()
def update_user(id):
    from flask import request
    if not check_admin():
        return jsonify({"message": "Admin access required"}), 403

    user = User.query.get(id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.get_json(silent=True) or {}
    user.name = data.get("name", user.name)
    user.email = data.get("email", user.email)
    
    new_role = data.get("role")
    if new_role and new_role in ["job_seeker", "recruiter", "admin"]:
        user.role = new_role

    db.session.commit()
    return jsonify({
        "message": "User updated successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }), 200


# ==========================
# EDIT JOB
# ==========================

@admin_bp.route("/jobs/<int:id>", methods=["PUT"])
@jwt_required()
def update_admin_job(id):
    from flask import request
    if not check_admin():
        return jsonify({"message": "Admin access required"}), 403

    job = Job.query.get(id)
    if not job:
        return jsonify({"message": "Job not found"}), 404

    data = request.get_json(silent=True) or {}
    job.title = data.get("title", job.title)
    job.location = data.get("location", job.location)
    job.salary = data.get("salary", job.salary)
    job.job_type = data.get("job_type", job.job_type)
    
    new_status = data.get("status")
    if new_status and new_status in ["open", "closed"]:
        job.status = new_status

    db.session.commit()
    return jsonify({
        "message": "Job updated successfully",
        "job": {
            "id": job.id,
            "title": job.title,
            "location": job.location,
            "status": job.status
        }
    }), 200


# ==========================
# GET REPORTS
# ==========================

@admin_bp.route("/reports", methods=["GET"])
@jwt_required()
def get_reports():
    if not check_admin():
        return jsonify({"message": "Admin access required"}), 403

    total_users = User.query.count()
    recruiters_count = User.query.filter_by(role="recruiter").count()
    seekers_count = User.query.filter_by(role="job_seeker").count()
    total_jobs = Job.query.count()
    open_jobs = Job.query.filter_by(status="open").count()
    closed_jobs = Job.query.filter_by(status="closed").count()
    total_apps = Application.query.count()

    # Status counts
    applied_count = Application.query.filter_by(status="Applied").count()
    shortlisted_count = Application.query.filter_by(status="Shortlisted").count()
    interview_count = Application.query.filter_by(status="Interview").count()
    selected_count = Application.query.filter_by(status="Selected").count()
    rejected_count = Application.query.filter_by(status="Rejected").count()

    return jsonify({
        "total_users": total_users,
        "recruiters_count": recruiters_count,
        "seekers_count": seekers_count,
        "total_jobs": total_jobs,
        "open_jobs": open_jobs,
        "closed_jobs": closed_jobs,
        "total_applications": total_apps,
        "application_status_breakdown": {
            "Applied": applied_count,
            "Shortlisted": shortlisted_count,
            "Interview": interview_count,
            "Selected": selected_count,
            "Rejected": rejected_count
        }
    }), 200