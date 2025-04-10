from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate

from config import Config

app = Flask(__name__)
app.config.from_object(Config)

db = SQLAlchemy(app) # Lie notre app à SQLAlchemy
ma = Marshmallow(app)
migrate = Migrate(app, db)

import routes
app.register_blueprint(routes.bp)