from models.models import Acteur
from flask import Blueprint
from datetime import datetime
from slugify import slugify
from sqlalchemy.orm import joinedload,aliased,relationship
from sqlalchemy import and_,func,text
import uuid

bp = Blueprint('main', __name__)
now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
# Importe toutes les routes ici (elles s’enregistreront sur ce blueprint)
from . import diagnostics, sites, nomenclatures,regions, departements,acteurs,communes,questions,mot_cle,reponses

def checkCCG(id_acteur):
    acteur = Acteur.query.filter_by(id_acteur=id_acteur).first()
    isCCG = False
    for cat in acteur.categories:
        if cat.libelle == "Membres ou participants au CCG":
            isCCG = True
            break
    return isCCG

