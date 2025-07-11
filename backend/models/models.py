# Import du db défini dans app.py
from flask_sqlalchemy import SQLAlchemy
from geoalchemy2 import Geometry
from sqlalchemy.dialects.postgresql import VARCHAR

db = SQLAlchemy() # Lie notre app à SQLAlchemy

