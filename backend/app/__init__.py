from config import Config
from flask import Flask
from models.models import db
from routes import bp
from flask_migrate import Migrate
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    migrate = Migrate(app, db)
    CORS(app, resources={r"/*": {"origins": "*"}})
    db.init_app(app)
    app.register_blueprint(bp)

    return app