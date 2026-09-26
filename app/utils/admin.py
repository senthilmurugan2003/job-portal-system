from flask_jwt_extended import get_jwt_identity
from app.models import User


def check_admin():

    user_id = get_jwt_identity()
    if not user_id:
        return None

    try:
        user = User.query.get(int(user_id))
    except (ValueError, TypeError):
        return None

    if not user:
        return None

    if user.role != "admin":
        return None

    return user