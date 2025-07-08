from config import Config
from flask import Flask
from models.models import db
from routes import bp
from flask_migrate import Migrate
from flask_cors import CORS
from configs.mail_config import mail 

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    mail.init_app(app)
    migrate = Migrate(app, db)
    CORS(app, resources={r"/*": {"origins": "*"}})
    db.init_app(app)
    app.register_blueprint(bp)

    return app