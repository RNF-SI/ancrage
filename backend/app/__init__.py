from config import Config
from flask import Flask
from models.models import db
from routes import bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)  # ou dict directement
    db.init_app(app)
    app.register_blueprint(bp)

    return app