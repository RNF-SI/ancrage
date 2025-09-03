from flask import Blueprint,request, jsonify, current_app, send_from_directory
from datetime import datetime
from slugify import slugify
from sqlalchemy.orm import joinedload,aliased,relationship
from sqlalchemy import and_,func,text
import uuid,json
from werkzeug.utils import secure_filename
from werkzeug.exceptions import NotFound


bp = Blueprint('main', __name__)

# Importe toutes les routes ici (elles s’enregistreront sur ce blueprint)
from . import diagnostics, sites, nomenclatures,regions, departements,acteurs,communes,questions,mot_cle,reponses,documents,mail



