from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import User, Recruiter

recruiter_bp = Blueprint(
    "recruiter",
    __name__,
    url_prefix="/api/recruiter"
)


@recruiter_bp.route("/profile", methods=["POST"])
@jwt_required()
def create_recruiter_profile():

    user_id = get_jwt_identity()

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if user.role != "recruiter":
        return jsonify({
            "message": "Only recruiters can create recruiter profile"
        }), 403

    existing_recruiter = Recruiter.query.filter_by(
        user_id=user.id
    ).first()

    if existing_recruiter:
        return jsonify({
            "message": "Recruiter profile already exists"
        }), 409

    data = request.get_json()

    phone = data.get("phone")
    designation = data.get("designation")

    recruiter = Recruiter(
        user_id=user.id,
        phone=phone,
        designation=designation
    )

    db.session.add(recruiter)
    db.session.commit()

    return jsonify({
        "message": "Recruiter profile created successfully",
        "recruiter": {
            "id": recruiter.id,
            "user_id": recruiter.user_id,
            "phone": recruiter.phone,
            "designation": recruiter.designation
        }
    }), 201