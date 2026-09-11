from flask import Flask

from config import Config

from app.extensions import db, migrate, jwt
from app.routes.profile import profile_bp
from app.routes.jobs import jobs_bp
from app.models import User
from app.routes.recruiter import recruiter_bp
from app.routes.company import company_bp
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
    from app.routes.auth import auth_bp

    app.register_blueprint(auth_bp)
    jwt.init_app(app)
    app.register_blueprint(profile_bp)
    app.register_blueprint(jobs_bp)
    app.register_blueprint(recruiter_bp)
    app.register_blueprint(company_bp)

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