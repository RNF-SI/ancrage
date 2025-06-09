from models.models import db, MotCle, Reponse, Acteur
from flask import request, jsonify
from schemas.metier import MotCleSchema
from routes import bp, joinedload
from routes.logger_config import logger

@bp.route('/mots_cles/<int:id_diagnostic>', methods=['GET'])
def getAllMotCles(id_diagnostic):
    logger.info(f"📋 Requête GET - Mots-clés pour diagnostic ID={id_diagnostic}")
    
    mot_cles = MotCle.query.filter_by(diagnostic_id=id_diagnostic).all()
    logger.debug(f"🔍 {len(mot_cles)} mots-clés trouvés pour le diagnostic {id_diagnostic}")
    
    schema = MotCleSchema(many=True)
    usersObj = schema.dump(mot_cles)
    return jsonify(usersObj)

@bp.route('/mots_cles/theme/<int:id_acteur>', methods=['GET'])
def getKeywordsByActor(id_acteur):
    logger.info(f"📋 Requête GET - Mots-clés liés à l'acteur ID={id_acteur}")

    mots_cles = (
        db.session.query(MotCle)
        .join(MotCle.reponses)
        .join(Reponse.acteur)
        .filter(Acteur.id_acteur == id_acteur)
        .options(joinedload(MotCle.categories))
        .all()
    )
    logger.debug(f"🔍 {len(mots_cles)} mots-clés récupérés pour l'acteur {id_acteur}")
    
    schema = MotCleSchema(many=True)
    return jsonify(schema.dump(mots_cles))