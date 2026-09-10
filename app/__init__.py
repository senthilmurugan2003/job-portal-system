from flask import Flask

from config import Config

from app.extensions import db, migrate, jwt
from app.models import User

def create_app():

    app = Flask(__name__)

    app.config.from_object(Config)


    # initialize extensions

    db.init_app(app)

    migrate.init_app(
        app,
        db
    )

    jwt.init_app(app)


    return app