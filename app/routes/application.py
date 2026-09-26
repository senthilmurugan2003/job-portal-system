
'''
from flask import Blueprint, request, jsonify

from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from app.extensions import db

from app.models import (
    User,
    JobSeeker,
    Job,
    Application
)



application_bp = Blueprint(
    "application",
    __name__,
    url_prefix="/api/applications"
)
@application_bp.route(
    "/apply/<int:job_id>",
    methods=["POST"]
)
@jwt_required()
def apply_job(job_id):


    user_id = get_jwt_identity()



    user = User.query.get(user_id)



    if not user:

        return jsonify({
            "message":"User not found"
        }),404



    if user.role != "job_seeker":

        return jsonify({
            "message":"Only job seekers can apply"
        }),403



    job_seeker = JobSeeker.query.filter_by(
        user_id=user.id
    ).first()



    if not job_seeker:

        return jsonify({
            "message":"Job seeker profile not found"
        }),404




    job = Job.query.get(job_id)



    if not job:

        return jsonify({
            "message":"Job not found"
        }),404



    existing_application = Application.query.filter_by(

        job_id=job.id,

        job_seeker_id=job_seeker.id

    ).first()



    if existing_application:

        return jsonify({

            "message":"Already applied for this job"

        }),409




    data=request.get_json()



    application = Application(

        job_id=job.id,

        job_seeker_id=job_seeker.id,

        cover_letter=data.get("cover_letter"),

        status="Applied"

    )



    db.session.add(application)

    db.session.commit()



    return jsonify({

        "message":"Job applied successfully",

        "application":{

            "id":application.id,

            "job_id":application.job_id,

            "status":application.status

        }

    }),201
@application_bp.route(
    "/job/<int:job_id>",
    methods=["GET"]
)
@jwt_required()
def get_job_applicants(job_id):


    user_id = get_jwt_identity()


    user = User.query.get(user_id)


    if not user:

        return jsonify({
            "message":"User not found"
        }),404



    if user.role != "recruiter":

        return jsonify({
            "message":"Only recruiters can view applicants"
        }),403



    job = Job.query.get(job_id)


    if not job:

        return jsonify({
            "message":"Job not found"
        }),404



    applications = Application.query.filter_by(
        job_id=job.id
    ).all()



    result=[]


    for application in applications:


        candidate = JobSeeker.query.get(
            application.job_seeker_id
        )


        result.append({

            "application_id": application.id,

            "candidate_id": candidate.id,

            "phone": candidate.phone,

            "qualification": candidate.qualification,

            "location": candidate.location,

            "experience": candidate.experience,

            "bio": candidate.bio,

            "resume_path": candidate.resume_path,

            "status": application.status

        })

    return jsonify(result),200
@application_bp.route(
    "/<int:application_id>/status",
    methods=["PUT"]
)
@jwt_required()
def update_application_status(application_id):


    user_id = get_jwt_identity()


    user = User.query.get(user_id)



    if not user:

        return jsonify({
            "message":"User not found"
        }),404



    if user.role != "recruiter":

        return jsonify({
            "message":"Only recruiters can update status"
        }),403



    application = Application.query.get(
        application_id
    )


    if not application:

        return jsonify({
            "message":"Application not found"
        }),404



    data = request.get_json()


    status = data.get("status")



    allowed_status = [

        "Applied",
        "Shortlisted",
        "Rejected",
        "Selected"

    ]



    if status not in allowed_status:

        return jsonify({

            "message":"Invalid status"

        }),400



    application.status = status


    db.session.commit()



    return jsonify({

        "message":"Application status updated",

        "status":application.status

    }),200
@application_bp.route(
    "/my",
    methods=["GET"]
)
@jwt_required()
def my_applications():

    user_id = get_jwt_identity()

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404


    if user.role != "job_seeker":
        return jsonify({
            "message": "Only job seekers can view applications"
        }), 403


    job_seeker = JobSeeker.query.filter_by(
        user_id=user.id
    ).first()


    if not job_seeker:
        return jsonify({
            "message": "Job seeker profile not found"
        }),404



    applications = Application.query.filter_by(
        job_seeker_id=job_seeker.id
    ).all()



    result = []


    for application in applications:

        job = Job.query.get(application.job_id)


        result.append({

            "application_id": application.id,

            "job_id": job.id,

            "job_title": job.title,

            "company": job.company.name if job.company else None,

            "status": application.status,

            "cover_letter": application.cover_letter

        })


    return jsonify(result),200
'''
from flask import Blueprint, request, jsonify

from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from app.extensions import db

from app.models import (
    User,
    Recruiter,
    Company,
    Job,
    Application,
    JobSeeker
)


# =========================================================
# BLUEPRINT
# =========================================================

application_bp = Blueprint(
    "application",
    __name__,
    url_prefix="/api/applications"
)


# =========================================================
# 1. JOB SEEKER - APPLY FOR JOB
# =========================================================

@application_bp.route("/apply/<int:job_id>", methods=["POST"])
@jwt_required()
def apply_job(job_id):

    # -----------------------------------------
    # Get logged-in user
    # -----------------------------------------

    user_id = int(get_jwt_identity())

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404
    # -----------------------------------------
    # Only job seekers can apply
    # -----------------------------------------

    if user.role != "job_seeker":

        return jsonify({
            "message": "Only job seekers can apply for jobs"
        }), 403


    # -----------------------------------------
    # Get job seeker profile
    # -----------------------------------------

    job_seeker = JobSeeker.query.filter_by(
        user_id=user.id
    ).first()

    if not job_seeker:

        return jsonify({
            "message": "Job seeker profile not found"
        }), 404


    # -----------------------------------------
    # Find job
    # -----------------------------------------

    job = Job.query.get(job_id)

    if not job:

        return jsonify({
            "message": "Job not found"
        }), 404


    # -----------------------------------------
    # Check if job is open
    # -----------------------------------------

    if hasattr(job, "status"):

        if job.status != "open":

            return jsonify({
                "message": "This job is no longer open"
            }), 400


    # -----------------------------------------
    # Check duplicate application
    # -----------------------------------------

    existing_application = Application.query.filter_by(
        job_id=job.id,
        job_seeker_id=job_seeker.id
    ).first()

    if existing_application:

        return jsonify({
            "message": "You have already applied for this job"
        }), 409


    # -----------------------------------------
    # Get request data
    # -----------------------------------------

    data = request.get_json(silent=True) or {}

    cover_letter = data.get("cover_letter")


    # -----------------------------------------
    # Create application
    # -----------------------------------------

    application = Application(
        job_id=job.id,
        job_seeker_id=job_seeker.id,
        cover_letter=cover_letter,
        status="Applied"
    )


    db.session.add(application)

    db.session.commit()


    # -----------------------------------------
    # Response
    # -----------------------------------------

    return jsonify({

        "message": "Job applied successfully",

        "application": {

            "id": application.id,

            "job_id": application.job_id,

            "job_seeker_id": application.job_seeker_id,

            "status": application.status,

            "cover_letter": application.cover_letter,

            "applied_at": application.applied_at

        }

    }), 201


# =========================================================
# 2. RECRUITER - GET APPLICANTS FOR ONE JOB
# =========================================================

@application_bp.route("/job/<int:job_id>", methods=["GET"])
@jwt_required()
def get_job_applicants(job_id):

    # -----------------------------------------
    # Get logged-in user
    # -----------------------------------------

    user_id = int(get_jwt_identity())

    user = User.query.get(user_id)

    if not user:

        return jsonify({
            "message": "User not found"
        }), 404


    # -----------------------------------------
    # Only recruiters
    # -----------------------------------------

    if user.role != "recruiter":

        return jsonify({
            "message": "Only recruiters can view applicants"
        }), 403


    # -----------------------------------------
    # Get recruiter
    # -----------------------------------------

    recruiter = Recruiter.query.filter_by(
        user_id=user.id
    ).first()

    if not recruiter:

        return jsonify({
            "message": "Recruiter profile not found"
        }), 404


    # -----------------------------------------
    # Find job
    # -----------------------------------------

    job = Job.query.get(job_id)

    if not job:

        return jsonify({
            "message": "Job not found"
        }), 404


    # -----------------------------------------
    # Find company
    # -----------------------------------------

    company = Company.query.get(
        job.company_id
    )

    if not company:

        return jsonify({
            "message": "Company not found for this job"
        }), 404


    # -----------------------------------------
    # SECURITY CHECK
    #
    # Make sure this company belongs
    # to the logged-in recruiter
    # -----------------------------------------

    if company.recruiter_id != recruiter.id:

        return jsonify({
            "message": "You are not authorized to view applicants for this job"
        }), 403


    # -----------------------------------------
    # Get applications
    # -----------------------------------------

    applications = Application.query.filter_by(
        job_id=job.id
    ).order_by(
        Application.applied_at.desc()
    ).all()


    result = []


    # -----------------------------------------
    # Build response
    # -----------------------------------------

    for application in applications:

        candidate = JobSeeker.query.get(
            application.job_seeker_id
        )

        if not candidate:
            continue


        candidate_user = User.query.get(
            candidate.user_id
        )

        if not candidate_user:
            continue


        result.append({

            "application_id": application.id,

            "candidate_id": candidate.id,

            "name": candidate_user.name,

            "email": candidate_user.email,

            "phone": candidate.phone,

            "qualification": candidate.qualification,

            "location": candidate.location,

            "experience": candidate.experience,

            "bio": candidate.bio,

            "resume_path": candidate.resume_path,

            "status": application.status,

            "cover_letter": application.cover_letter,

            "applied_at": application.applied_at,

            "job_id": job.id,

            "job_title": job.title,

            "job_status": job.status,

            "job_location": job.location,

            "salary": job.salary,

            "job_type": job.job_type,

            "skills": job.skills,

            "company": company.company_name

        })


    return jsonify(result), 200


# =========================================================
# 3. RECRUITER - GET ALL APPLICANTS
# =========================================================

@application_bp.route("/recruiter", methods=["GET"])
@jwt_required()
def get_all_recruiter_applicants():

    # -----------------------------------------
    # Get logged-in user
    # -----------------------------------------

    user_id = int(get_jwt_identity())

    user = User.query.get(user_id)

    if not user:

        return jsonify({
            "message": "User not found"
        }), 404


    # -----------------------------------------
    # Only recruiters
    # -----------------------------------------

    if user.role != "recruiter":

        return jsonify({
            "message": "Only recruiters can view applicants"
        }), 403


    # -----------------------------------------
    # Get recruiter profile
    # -----------------------------------------

    recruiter = Recruiter.query.filter_by(
        user_id=user.id
    ).first()

    if not recruiter:

        return jsonify({
            "message": "Recruiter profile not found"
        }), 404


    # -----------------------------------------
    # Find companies belonging to recruiter
    # -----------------------------------------

    companies = Company.query.filter_by(
        recruiter_id=recruiter.id
    ).all()


    # If recruiter has no company
    if not companies:

        return jsonify([]), 200


    # -----------------------------------------
    # Get company IDs
    # -----------------------------------------

    company_ids = [

        company.id

        for company in companies

    ]


    # -----------------------------------------
    # Find jobs belonging to those companies
    # -----------------------------------------

    jobs = Job.query.filter(
        Job.company_id.in_(company_ids)
    ).all()


    # If recruiter has no jobs
    if not jobs:

        return jsonify([]), 200


    # -----------------------------------------
    # Create job dictionary
    #
    # This avoids repeatedly querying
    # the database inside the loop.
    # -----------------------------------------

    job_map = {

        job.id: job

        for job in jobs

    }


    # -----------------------------------------
    # Create company dictionary
    # -----------------------------------------

    company_map = {

        company.id: company

        for company in companies

    }


    # -----------------------------------------
    # Get all job IDs
    # -----------------------------------------

    job_ids = list(
        job_map.keys()
    )


    # -----------------------------------------
    # Find all applications
    # -----------------------------------------

    applications = Application.query.filter(
        Application.job_id.in_(job_ids)
    ).order_by(
        Application.applied_at.desc()
    ).all()


    result = []


    # -----------------------------------------
    # Build response
    # -----------------------------------------

    for application in applications:

        # -------------------------------------
        # Get job
        # -------------------------------------

        job = job_map.get(
            application.job_id
        )

        if not job:
            continue


        # -------------------------------------
        # Get candidate
        # -------------------------------------

        candidate = JobSeeker.query.get(
            application.job_seeker_id
        )

        if not candidate:
            continue


        # -------------------------------------
        # Get candidate user account
        # -------------------------------------

        candidate_user = User.query.get(
            candidate.user_id
        )

        if not candidate_user:
            continue


        # -------------------------------------
        # Get company
        # -------------------------------------

        company = company_map.get(
            job.company_id
        )


        # -------------------------------------
        # Add applicant
        # -------------------------------------

        result.append({

            "application_id": application.id,

            "candidate_id": candidate.id,

            "name": candidate_user.name,

            "email": candidate_user.email,

            "phone": candidate.phone,

            "qualification": candidate.qualification,

            "location": candidate.location,

            "experience": candidate.experience,

            "bio": candidate.bio,

            "resume_path": candidate.resume_path,

            "status": application.status,

            "cover_letter": application.cover_letter,

            "applied_at": application.applied_at,

            "job_id": job.id,

            "job_title": job.title,

            "job_status": job.status,

            "job_location": job.location,

            "salary": job.salary,

            "job_type": job.job_type,

            "skills": job.skills,

            "company": (
                company.company_name
                if company
                else None
            )

        })


    return jsonify(result), 200


# =========================================================
# 4. RECRUITER - UPDATE APPLICATION STATUS
# =========================================================

@application_bp.route(
    "/<int:application_id>/status",
    methods=["PUT"]
)
@jwt_required()
def update_application_status(application_id):

    # -----------------------------------------
    # Get logged-in user
    # -----------------------------------------

    user_id = int(get_jwt_identity())

    user = User.query.get(user_id)

    if not user:

        return jsonify({
            "message": "User not found"
        }), 404


    # -----------------------------------------
    # Only recruiters
    # -----------------------------------------

    if user.role != "recruiter":

        return jsonify({
            "message": "Only recruiters can update application status"
        }), 403


    # -----------------------------------------
    # Get recruiter
    # -----------------------------------------

    recruiter = Recruiter.query.filter_by(
        user_id=user.id
    ).first()

    if not recruiter:

        return jsonify({
            "message": "Recruiter profile not found"
        }), 404


    # -----------------------------------------
    # Find application
    # -----------------------------------------

    application = Application.query.get(
        application_id
    )

    if not application:

        return jsonify({
            "message": "Application not found"
        }), 404


    # -----------------------------------------
    # Get job
    # -----------------------------------------

    job = Job.query.get(
        application.job_id
    )

    if not job:

        return jsonify({
            "message": "Job not found"
        }), 404


    # -----------------------------------------
    # Get company
    # -----------------------------------------

    company = Company.query.get(
        job.company_id
    )

    if not company:

        return jsonify({
            "message": "Company not found"
        }), 404


    # -----------------------------------------
    # SECURITY CHECK
    #
    # Recruiter can only update applications
    # belonging to their company.
    # -----------------------------------------

    if company.recruiter_id != recruiter.id:

        return jsonify({
            "message": "You are not authorized to update this application"
        }), 403


    # -----------------------------------------
    # Get request body
    # -----------------------------------------

    data = request.get_json(
        silent=True
    ) or {}


    status = data.get(
        "status"
    )


    # -----------------------------------------
    # Allowed statuses
    # -----------------------------------------

    allowed_statuses = [

        "Applied",

        "Shortlisted",

        "Interview",

        "Selected",

        "Rejected"

    ]


    if status not in allowed_statuses:

        return jsonify({

            "message": "Invalid status",

            "allowed_status": allowed_statuses

        }), 400


    # -----------------------------------------
    # Update status
    # -----------------------------------------

    application.status = status

    db.session.commit()


    # -----------------------------------------
    # Response
    # -----------------------------------------

    return jsonify({

        "message": "Application status updated successfully",

        "application": {

            "id": application.id,

            "status": application.status

        }

    }), 200


# =========================================================
# 5. JOB SEEKER - VIEW MY APPLICATIONS
# =========================================================

@application_bp.route(
    "/my",
    methods=["GET"]
)
@jwt_required()
def my_applications():

    # -----------------------------------------
    # Get logged-in user
    # -----------------------------------------

    user_id = int(get_jwt_identity())

    user = User.query.get(
        user_id
    )

    if not user:

        return jsonify({
            "message": "User not found"
        }), 404


    # -----------------------------------------
    # Only job seekers
    # -----------------------------------------

    if user.role != "job_seeker":

        return jsonify({
            "message": "Only job seekers can view their applications"
        }), 403


    # -----------------------------------------
    # Get job seeker
    # -----------------------------------------

    job_seeker = JobSeeker.query.filter_by(
        user_id=user.id
    ).first()

    if not job_seeker:

        return jsonify({
            "message": "Job seeker profile not found"
        }), 404


    # -----------------------------------------
    # Get applications
    # -----------------------------------------

    applications = Application.query.filter_by(
        job_seeker_id=job_seeker.id
    ).order_by(
        Application.applied_at.desc()
    ).all()


    result = []


    # -----------------------------------------
    # Build response
    # -----------------------------------------

    for application in applications:

        job = Job.query.get(
            application.job_id
        )

        if not job:
            continue


        company = Company.query.get(
            job.company_id
        )


        result.append({

            "application_id": application.id,

            "status": application.status,

            "cover_letter": application.cover_letter,

            "applied_at": application.applied_at,

            "job_id": job.id,

            "role": job.title,

            "location": job.location,

            "salary": job.salary,

            "experience": job.experience,

            "job_type": job.job_type,

            "skills": job.skills,

            "company": (
                company.company_name
                if company
                else None
            )

        })


    return jsonify(result), 200