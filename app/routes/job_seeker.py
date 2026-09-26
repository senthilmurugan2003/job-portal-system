from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import User, JobSeeker


job_seeker_bp = Blueprint(
    "job_seeker",
    __name__,
    url_prefix="/api/job-seeker"
)


# ===============================
# CREATE JOB SEEKER PROFILE
# ===============================

@job_seeker_bp.route("/profile", methods=["POST"])
@jwt_required()
def create_profile():

    user_id = int(get_jwt_identity())


    user = User.query.get(user_id)


    if not user:

        return jsonify({
            "message": "User not found"
        }), 404



    if user.role != "job_seeker":

        return jsonify({
            "message": "Only job seekers can create profile"
        }), 403



    existing_profile = JobSeeker.query.filter_by(
        user_id=user.id
    ).first()



    if existing_profile:

        return jsonify({
            "message": "Profile already exists"
        }), 409



    data = request.get_json()



    phone = data.get("phone")
    qualification = data.get("qualification")
    location = data.get("location")
    experience = data.get("experience")
    bio = data.get("bio")
    skills = data.get("skills")
    preferred_role = data.get("preferred_role")
    resume_path = data.get("resume_path")

    profile = JobSeeker(
        user_id=user.id,
        phone=phone,
        qualification=qualification,
        location=location,
        experience=experience,
        bio=bio,
        skills=skills,
        preferred_role=preferred_role,
        resume_path=resume_path
    )

    db.session.add(profile)
    db.session.commit()

    return jsonify({
        "message": "Job seeker profile created successfully",
        "profile": {
            "id": profile.id,
            "phone": profile.phone,
            "qualification": profile.qualification,
            "location": profile.location,
            "experience": profile.experience,
            "bio": profile.bio,
            "skills": profile.skills,
            "preferred_role": profile.preferred_role,
            "resume_path": profile.resume_path
        }
    }), 201


# ===============================
# GET JOB SEEKER PROFILE
# ===============================

@job_seeker_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    profile = JobSeeker.query.filter_by(user_id=user_id).first()

    if not profile:
        return jsonify({"message": "Profile not found"}), 404

    return jsonify({
        "id": profile.id,
        "phone": profile.phone,
        "qualification": profile.qualification,
        "location": profile.location,
        "experience": profile.experience,
        "bio": profile.bio,
        "skills": getattr(profile, "skills", None),
        "preferred_role": getattr(profile, "preferred_role", None),
        "resume_path": profile.resume_path
    }), 200


# ===============================
# UPDATE JOB SEEKER PROFILE
# ===============================

@job_seeker_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    profile = JobSeeker.query.filter_by(user_id=user_id).first()

    if not profile:
        return jsonify({"message": "Profile not found"}), 404

    data = request.get_json() or {}

    profile.phone = data.get("phone", profile.phone)
    profile.qualification = data.get("qualification", profile.qualification)
    profile.location = data.get("location", profile.location)
    profile.experience = data.get("experience", profile.experience)
    profile.bio = data.get("bio", profile.bio)
    profile.skills = data.get("skills", getattr(profile, "skills", None))
    profile.preferred_role = data.get("preferred_role", getattr(profile, "preferred_role", None))
    profile.resume_path = data.get("resume_path", profile.resume_path)

    db.session.commit()

    return jsonify({"message": "Profile updated successfully"}), 200


# ===============================
# GET RECOMMENDED JOBS FOR PROFILE
# ===============================

@job_seeker_bp.route("/recommendations", methods=["GET"])
@jwt_required()
def get_recommendations():
    from app.services.recommendation import get_job_recommendations

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.role != "job_seeker":
        return jsonify({"message": "Only job seekers can view recommendations"}), 403

    profile = JobSeeker.query.filter_by(user_id=user.id).first()

    # Create temporary profile wrapper if profile does not exist yet
    if not profile:
        class TempProfile:
            skills = ""
            qualification = ""
            experience = ""
            location = ""
            preferred_role = ""
            bio = ""
            resume_path = None
        profile = TempProfile()

    recommendations = get_job_recommendations(profile)
    return jsonify(recommendations), 200


# ===============================
# UPLOAD RESUME
# ===============================

ALLOWED_EXTENSIONS = {"pdf", "doc", "docx"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@job_seeker_bp.route("/resume", methods=["POST"])
@jwt_required()
def upload_resume():
    import os
    import uuid
    from werkzeug.utils import secure_filename
    from flask import current_app

    user_id = int(get_jwt_identity())
    user_id_int = int(user_id) if user_id else None

    profile = JobSeeker.query.filter_by(user_id=user_id_int).first()
    if not profile:
        return jsonify({"message": "Job seeker profile not found"}), 404

    if "resume" not in request.files:
        return jsonify({"message": "No file uploaded"}), 400

    file = request.files["resume"]
    if file.filename == "":
        return jsonify({"message": "No selected file"}), 400

    if file and allowed_file(file.filename):
        ext = file.filename.rsplit(".", 1)[1].lower()
        filename = f"resume_{profile.id}_{uuid.uuid4().hex[:8]}.{ext}"
        upload_folder = os.path.join(current_app.root_path, "static", "uploads", "resumes")
        os.makedirs(upload_folder, exist_ok=True)
        save_path = os.path.join(upload_folder, filename)
        file.save(save_path)

        relative_path = f"uploads/resumes/{filename}"
        profile.resume_path = relative_path
        db.session.commit()

        return jsonify({
            "message": "Resume uploaded successfully",
            "resume_path": relative_path
        }), 200

    return jsonify({"message": "Invalid file type. Allowed: PDF, DOC, DOCX"}), 400