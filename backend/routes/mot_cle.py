from models.models import db, MotCle, Reponse, Acteur
from flask import request, jsonify
from schemas.metier import MotCleSchema
from routes import bp, joinedload
from routes.logger_config import logger
from backend.services.mot_cle_service import MotCleService

# Instancier le service
mot_cle_service = MotCleService()

@bp.route('/mots_cles/<int:id_diagnostic>', methods=['GET'])
def getAllMotCles(id_diagnostic):
    """Récupère tous les mots-clés d'un diagnostic - REFACTORISÉ"""
    logger.info(f"📋 Requête GET - Mots-clés pour diagnostic ID={id_diagnostic}")
    
    # Utilisation du service au lieu de la logique directe
    result = mot_cle_service.get_by_diagnostic(id_diagnostic)
    logger.debug(f"🔍 {len(result)} mots-clés trouvés pour le diagnostic {id_diagnostic}")
    
    return jsonify(result)

@bp.route('/mots_cles/theme/<int:id_acteur>', methods=['GET'])
def getKeywordsByActor(id_acteur):
    """Récupère mots-clés par acteur - REFACTORISÉ"""
    return jsonify(mot_cle_service.get_by_actor(id_acteur))

@bp.route('/mot_cle/<int:id_mot_cle>', methods=['PUT'])
def rename(id_mot_cle):
    """Renomme un mot-clé - REFACTORISÉ"""
    if request.method == 'PUT':
        data = request.get_json()
        print(data['nom'])  # Garde le print original pour compatibilité
        
        # Utilisation du service avec validation JSON
        from backend.error_handlers import validate_json_request
        validated_data = validate_json_request(request)
        result = mot_cle_service.update_with_relations(id_mot_cle, validated_data)
        
        return jsonify(result)
    
@bp.route('/mot_cle', methods=['POST'])
def create_mot_cle():
    """Crée un mot-clé avec enfants - REFACTORISÉ logique métier dans service"""
    from backend.error_handlers import validate_json_request
    
    try:
        data = validate_json_request(request)
        result = mot_cle_service.create_with_children(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
       