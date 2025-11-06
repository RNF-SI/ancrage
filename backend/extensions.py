from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from slugify import slugify
from marshmallow import fields, Schema
from sqlalchemy import distinct
from flask_mail import Mail

db = SQLAlchemy()
ma = Marshmallow()
migrate = Migrate()
mail = Mail()