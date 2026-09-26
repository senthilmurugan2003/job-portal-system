from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.models import User


profile_bp = Blueprint(
    "profile",
    __name__,
    url_prefix="/api"
)


@profile_bp.route("/profile", methods=["GET"])
@jwt_required()
def profile():

    user_id = int(get_jwt_identity())

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "message": "User not found"
        }), 404


    return jsonify({

        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role

    }), 200