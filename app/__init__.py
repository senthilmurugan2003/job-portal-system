import os
from flask import Flask, send_from_directory
from config import Config
from app.extensions import db, migrate, jwt
from flask_cors import CORS


def create_app():
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(Config)

    # Initialize extensions
    CORS(app)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Import models for SQLAlchemy and Flask-Migrate
    from app.models import (
        User,
        JobSeeker,
        Recruiter,
        Company,
        Job,
        Application
    )

    # Import Blueprints
    from app.routes.auth import auth_bp
    from app.routes.profile import profile_bp
    from app.routes.jobs import jobs_bp
    from app.routes.recruiter import recruiter_bp
    from app.routes.company import company_bp
    from app.routes.job_seeker import job_seeker_bp
    from app.routes.application import application_bp
    from app.routes.admin import admin_bp

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(jobs_bp)
    app.register_blueprint(recruiter_bp)
    app.register_blueprint(company_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(job_seeker_bp)
    app.register_blueprint(application_bp)

    # Route for serving uploaded files (resumes)
    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        upload_dir = os.path.join(app.root_path, "static", "uploads")
        return send_from_directory(upload_dir, filename)

    # Automatic table creation & column check for deployment
    with app.app_context():
        try:
            db.create_all()
            from sqlalchemy import inspect, text
            inspector = inspect(db.engine)
            if "job_seekers" in inspector.get_table_names():
                columns = [c["name"] for c in inspector.get_columns("job_seekers")]
                if "skills" not in columns:
                    db.session.execute(text("ALTER TABLE job_seekers ADD COLUMN skills TEXT NULL"))
                    db.session.commit()
                if "preferred_role" not in columns:
                    db.session.execute(text("ALTER TABLE job_seekers ADD COLUMN preferred_role VARCHAR(100) NULL"))
                    db.session.commit()
        except Exception as e:
            print("Auto DB Table/Column Migration Notice:", e)

    return app