from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import User, Recruiter, Company


company_bp = Blueprint(
    "company",
    __name__,
    url_prefix="/api/company"
)


@company_bp.route("", methods=["POST"])
@jwt_required()
def create_company():

    user_id = int(get_jwt_identity())

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404

    if user.role != "recruiter":
        return jsonify({
            "message": "Only recruiters can create company"
        }), 403

    recruiter = Recruiter.query.filter_by(
        user_id=user.id
    ).first()

    if not recruiter:
        return jsonify({
            "message": "Recruiter profile not found"
        }), 404

    existing_company = Company.query.filter_by(
        recruiter_id=recruiter.id
    ).first()

    if existing_company:
        return jsonify({
            "message": "Company already exists"
        }), 409

    data = request.get_json()

    company_name = data.get("company_name")
    description = data.get("description")
    location = data.get("location")
    website = data.get("website")

    if not company_name:
        return jsonify({
            "message": "Company name is required"
        }), 400

    company = Company(
        recruiter_id=recruiter.id,
        company_name=company_name,
        description=description,
        location=location,
        website=website
    )

    db.session.add(company)
    db.session.commit()

    return jsonify({
        "message": "Company created successfully",
        "company": {
            "id": company.id,
            "company_name": company.company_name,
            "location": company.location,
            "website": company.website,
            "description": company.description
        }
    }), 201


@company_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_company_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(int(user_id) if user_id else None)

    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.role != "recruiter":
        return jsonify({"message": "Only recruiters can access company profile"}), 403

    recruiter = Recruiter.query.filter_by(user_id=user.id).first()
    if not recruiter:
        return jsonify({"message": "Recruiter profile not found"}), 404

    company = Company.query.filter_by(recruiter_id=recruiter.id).first()
    if not company:
        return jsonify({"message": "Company profile not found"}), 404

    return jsonify({
        "id": company.id,
        "company_name": company.company_name,
        "description": company.description,
        "location": company.location,
        "website": company.website,
        "created_at": company.created_at
    }), 200


@company_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_company_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(int(user_id) if user_id else None)

    if not user:
        return jsonify({"message": "User not found"}), 404

    if user.role != "recruiter":
        return jsonify({"message": "Only recruiters can update company profile"}), 403

    recruiter = Recruiter.query.filter_by(user_id=user.id).first()
    if not recruiter:
        return jsonify({"message": "Recruiter profile not found"}), 404

    company = Company.query.filter_by(recruiter_id=recruiter.id).first()
    data = request.get_json(silent=True) or {}

    if not company:
        company_name = data.get("company_name")
        if not company_name:
            return jsonify({"message": "Company name is required"}), 400

        company = Company(
            recruiter_id=recruiter.id,
            company_name=company_name,
            description=data.get("description"),
            location=data.get("location"),
            website=data.get("website")
        )
        db.session.add(company)
    else:
        company.company_name = data.get("company_name", company.company_name)
        company.description = data.get("description", company.description)
        company.location = data.get("location", company.location)
        company.website = data.get("website", company.website)

    db.session.commit()

    return jsonify({
        "message": "Company profile updated successfully",
        "company": {
            "id": company.id,
            "company_name": company.company_name,
            "description": company.description,
            "location": company.location,
            "website": company.website
        }
    }), 200