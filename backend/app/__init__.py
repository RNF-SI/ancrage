from config import Config
from flask import Flask
from models.models import db
from routes import bp
from flask_migrate import Migrate

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    migrate = Migrate(app, db)
    db.init_app(app)
    app.register_blueprint(bp)

    return app