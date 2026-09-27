from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models import User


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)

@auth_bp.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    if not name or not email or not password or not role:
        return jsonify({
            "message": "All fields are required"
        }), 400

    existing_user = User.query.filter_by(
        email=email
    ).first()

    if existing_user:
        return jsonify({
            "message": "Email already registered"
        }), 409

    password_hash = generate_password_hash(password)

    user = User(
        name=name,
        email=email,
        password_hash=password_hash,
        role=role
    )

    db.session.add(user)
    db.session.commit()

    # Automatically create profile record based on role
    from app.models import JobSeeker, Recruiter
    if role == "job_seeker":
        profile = JobSeeker(user_id=user.id)
        db.session.add(profile)
        db.session.commit()
    elif role == "recruiter":
        profile = Recruiter(user_id=user.id)
        db.session.add(profile)
        db.session.commit()

    # Send welcome registration email
    from app.services.email_service import send_registration_email
    send_registration_email(user.email, user.name)

    return jsonify({
        "message": "User registered successfully"
    }), 201
@auth_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "message": "Email and password are required"
        }), 400

    user = User.query.filter_by(
        email=email
    ).first()

    if not user:
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    password_valid = check_password_hash(
        user.password_hash,
        password
    )

    if not password_valid:
        return jsonify({
            "message": "Invalid email or password"
        }), 401

    access_token = create_access_token(
        identity=str(user.id)
    )
    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }), 200


# =========================================================
# 3. FORGOT PASSWORD
# =========================================================

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    import secrets
    from datetime import datetime, timedelta
    from config import Config
    from app.services.email_service import send_password_reset_email

    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()

    if not email:
        return jsonify({
            "message": "Email is required"
        }), 400

    user = User.query.filter_by(email=email).first()

    if user:
        # Generate secure random token
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expiry = datetime.utcnow() + timedelta(minutes=30)
        db.session.commit()

        # Build reset password URL
        frontend_url = Config.FRONTEND_URL.rstrip("/")
        reset_link = f"{frontend_url}/pages/reset-password.html?token={token}"

        # Send password reset email
        send_password_reset_email(user.email, user.name, reset_link)

    # Return message
    return jsonify({
        "message": "If an account exists with that email, a password reset link has been sent."
    }), 200


# =========================================================
# 4. RESET PASSWORD
# =========================================================

@auth_bp.route("/reset-password", methods=["POST"])
@auth_bp.route("/reset-password/<string:token>", methods=["POST"])
def reset_password(token=None):
    from datetime import datetime

    data = request.get_json(silent=True) or {}
    token = token or data.get("token")
    new_password = data.get("new_password") or data.get("password")
    confirm_password = data.get("confirm_password")

    if not token:
        return jsonify({
            "message": "Reset token is required"
        }), 400

    if not new_password:
        return jsonify({
            "message": "New password is required"
        }), 400

    if len(new_password) < 6:
        return jsonify({
            "message": "Password must be at least 6 characters"
        }), 400

    if confirm_password and new_password != confirm_password:
        return jsonify({
            "message": "Passwords do not match"
        }), 400

    user = User.query.filter_by(reset_token=token).first()

    if not user or not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
        return jsonify({
            "message": "Invalid or expired reset token"
        }), 400

    # Update password and clear token
    user.password_hash = generate_password_hash(new_password)
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()

    return jsonify({
        "message": "Password has been reset successfully. You can now login with your new password."
    }), 200