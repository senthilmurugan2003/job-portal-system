from flask import Flask

from config import Config

from app.extensions import db, migrate, jwt
from app.models import User
from app.models import (
    User,
    JobSeeker,
    Recruiter,
    Company,
    Job,
    Application
)
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
'''
from flask import Flask
from config import Config
from app.extensions import db, migrate, jwt


def create_app():

    app = Flask(__name__)

    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    from app.models import User, JobSeeker, Recruiter, Company, Job

    return app
    '''