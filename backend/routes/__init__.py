from flask import Blueprint
from datetime import datetime
from slugify import slugify
import uuid
bp = Blueprint('main', __name__)
now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
# Importe toutes les routes ici (elles s’enregistreront sur ce blueprint)
from . import diagnostics, sites, nomenclatures,regions, departements,acteurs,communes,questions,mot_cle

