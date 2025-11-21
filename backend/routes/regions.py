from models.models import db
from flask import request, jsonify
from schemas.metier import *
from routes import bp
from configs.logger_config import logger
from pypnusershub.decorators import check_auth
from routes.auth_decorators import require_auth
try:
    from pypnusershub.login_manager import login_required
except ImportError:
    # Fallback vers flask_login si pypnusershub ne l'exporte pas directement
    from flask_login import login_required

@bp.route('/region/<id_region>', methods=['GET','PUT','DELETE'])
@require_auth
@check_auth(1)
def regionMethods(id_region):
    region = Region.query.filter_by(id_region=id_region).first()
    logger.info(f"Requête sur la région ID={id_region} : {region}")

    if not region:
        logger.warning(f"Région ID={id_region} non trouvée")
        return jsonify({'error': 'Région non trouvée'}), 404

    if request.method == 'GET':
        logger.info("Méthode GET appelée pour /region/<id_region>")
        return getRegion(region)

    elif request.method == 'PUT':
        data = request.get_json()
        logger.info(f"Méthode PUT appelée avec données : {data}")
        region = changeValuesRegion(region,data)
        db.session.commit()
        logger.info(f"Région mise à jour : {region}")
        return getRegion(region)

    elif request.method == 'DELETE':
        logger.info(f"Méthode DELETE appelée pour région ID={id_region}")
        db.session.delete(region)
        db.session.commit()
        logger.info("Suppression effectuée")
        return {"success": "Suppression terminée"}

@bp.route('/region',methods=['POST'])
@require_auth
@check_auth(1)
def postRegion():
    if request.method == 'POST': 
        data = request.get_json()
        logger.info(f"Méthode POST appelée avec données : {data}")
        region = Region()
        region = changeValuesRegion(region,data)
        db.session.add(region)
        db.session.commit()
        logger.info(f"Nouvelle région créée : {region}")
        return getRegion(region)

@bp.route('/regions',methods=['GET'])
@require_auth
@check_auth(1)
def getAllRegions():
    if request.method == 'GET': 
        logger.info("Récupération de toutes les régions")
        regions = Region.query.filter_by().all()
        schema = RegionSchema(many=True)
        usersObj = schema.dump(regions)
        return jsonify(usersObj)

@bp.route('/regions/<mnemonique>',methods=['GET'])
@require_auth
@check_auth(1)
def getAllRegionsByUSer(mnemonique):
    if request.method == 'GET': 
        logger.info(f"Récupération des régions avec mnemonique = {mnemonique}")
        regions = Region.query.filter_by(mnemonique=mnemonique).all()
        schema = RegionSchema(many=True)
        regionsObj = schema.dump(regions)
        return jsonify(regionsObj)

def changeValuesRegion(region,data):
    logger.debug(f"Attribution des valeurs à la région depuis data : {data}")
    region.libelle = data['nom']
    region.mnemonique = data['position_x']
    return region

def getRegion(region):
    logger.debug(f"Sérialisation de la région : {region}")
    schema = RegionSchema(many=False)
    regionObj = schema.dump(region)
    return jsonify(regionObj)
