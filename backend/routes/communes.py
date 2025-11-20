from models.models import db
from flask import request, jsonify
from models.models import *
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

@bp.route('/commune/<id_commune>', methods=['GET', 'PUT', 'DELETE'])
@require_auth
@check_auth(1)
def communeMethods(id_commune):
    logger.info(f"📍 Requête {request.method} sur la commune ID={id_commune}")
    commune = Commune.query.filter_by(id_commune=id_commune).first()

    if not commune:
        logger.warning(f"❌ Commune ID={id_commune} non trouvée")
        return jsonify({'error': 'Commune non trouvée'}), 404

    if request.method == 'GET':
        logger.info(f"📤 Récupération des infos de la commune ID={id_commune}")
        return getCommune(commune)

    elif request.method == 'PUT':
        data = request.get_json()
        logger.info(f"✏ Mise à jour de la commune ID={id_commune} avec données : {data}")
        commune = changeValuesCommune(commune, data)
        db.session.commit()
        logger.info(f"✅ Commune ID={id_commune} mise à jour avec succès")
        return getCommune(commune)

    elif request.method == 'DELETE':
        logger.info(f"🗑 Suppression de la commune ID={id_commune}")
        db.session.delete(commune)
        db.session.commit()
        logger.info(f"✅ Commune ID={id_commune} supprimée")
        return {"success": "Suppression terminée"}

@bp.route('/communes', methods=['GET'])
@require_auth
@check_auth(1)
def getAllCommunes():
    if request.method == 'GET':
        logger.info("📋 Récupération de toutes les communes (sans champs volumineux)")
        communes = Commune.query.all()
        schema = CommuneSchema(many=True, exclude=(
            'geom', 'code_epci', 'insee_arr', 'insee_can', 'insee_reg',
            'population', 'statut', 'departement', 'latitude', 'longitude'
        ))
        usersObj = schema.dump(communes)
        logger.info(f"📦 {len(communes)} communes récupérées")
        return jsonify(usersObj)

def changeValuesCommune(commune, data):
    logger.debug(f"🔄 Mise à jour des champs de la commune avec : {data}")
    commune.libelle = data['nom']
    commune.mnemonique = data['position_x']
    return commune

def getCommune(commune):
    logger.debug(f"📤 Sérialisation de la commune ID={commune.id_commune}")
    schema = CommuneSchema(many=False)
    communeObj = schema.dump(commune)
    return jsonify(communeObj)