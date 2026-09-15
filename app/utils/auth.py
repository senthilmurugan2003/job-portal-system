from flask_jwt_extended import get_jwt_identity

from app.models import User


def get_current_user():

    user_id = get_jwt_identity()

    user = User.query.get(user_id)

    return user



def recruiter_required():

    user = get_current_user()

    if not user:
        return None


    if user.role != "recruiter":
        return None


    return user