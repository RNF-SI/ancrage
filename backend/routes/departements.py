from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp
from routes.logger_config import logger

@bp.route('/departement/<id_departement>', methods=['GET', 'PUT', 'DELETE'])
def departementMethods(id_departement):
    logger.info(f"📍 Requête {request.method} sur le département ID={id_departement}")
    departement = Departement.query.filter_by(id_departement=id_departement).first()

    if not departement:
        logger.warning(f"❌ Département ID={id_departement} non trouvé")
        return jsonify({'error': 'Département non trouvé'}), 404

    if request.method == 'GET':
        logger.info(f"📤 Récupération des infos du département ID={id_departement}")
        return getDepartement(departement)

    elif request.method == 'PUT':
        data = request.get_json()
        logger.info(f"✏ Mise à jour du département ID={id_departement} avec données : {data}")
        departement = changeValuesDepartement(departement, data)
        db.session.commit()
        logger.info(f"✅ Département ID={id_departement} mis à jour")
        return getDepartement(departement)

    elif request.method == 'DELETE':
        logger.info(f"🗑 Suppression du département ID={id_departement}")
        db.session.delete(departement)
        db.session.commit()
        logger.info(f"✅ Département ID={id_departement} supprimé")
        return {"success": "Suppression terminée"}

@bp.route('/departement', methods=['POST'])
def postDepartement():
    if request.method == 'POST':
        data = request.get_json()
        logger.info(f"📥 Création d'un nouveau département avec données : {data}")
        departement = Departement()
        departement = changeValuesDepartement(departement, data)
        db.session.add(departement)
        db.session.commit()
        logger.info(f"✅ Nouveau département créé avec ID={departement.id_departement}")
        return getDepartement(departement)

@bp.route('/departements', methods=['GET'])
def getAllDepartements():
    if request.method == 'GET':
        logger.info("📋 Récupération de tous les départements")
        departements = Departement.query.all()
        schema = DepartementSchema(many=True)
        departementsObj = schema.dump(departements)
        logger.info(f"📦 {len(departements)} départements récupérés")
        return jsonify(departementsObj)

@bp.route('/departements/<mnemonique>', methods=['GET'])
def getAllDepartementsByUSer(mnemonique):
    if request.method == 'GET':
        logger.info(f"📋 Récupération des départements par mnemonique = {mnemonique}")
        departements = Departement.query.filter_by(mnemonique=mnemonique).all()
        schema = DepartementSchema(many=True)
        departementsObj = schema.dump(departements)
        logger.info(f"📦 {len(departements)} départements trouvés pour '{mnemonique}'")
        return jsonify(departementsObj)

def changeValuesDepartement(departement, data):
    logger.debug(f"🔄 Mise à jour des champs du département avec : {data}")
    departement.libelle = data['nom']
    departement.mnemonique = data['position_x']
    return departement

def getDepartement(departement):
    logger.debug(f"📤 Sérialisation du département ID={departement.id_departement}")
    schema = DepartementSchema(many=False)
    departementObj = schema.dump(departement)
    return jsonify(departementObj)