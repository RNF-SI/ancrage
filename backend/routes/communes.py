from flask import request, jsonify
from backend.routes import bp
from backend.services.commune_service import CommuneService
from backend.error_handlers import validate_json_request
from backend.app import db

# Instancier le service
commune_service = CommuneService()

@bp.route('/commune/<int:id_commune>', methods=['GET', 'PUT', 'DELETE'])
def communeMethods(id_commune):
    """Récupère, met à jour ou supprime une commune"""
    if request.method == 'GET':
        commune = commune_service.model.query.get(id_commune)
        if not commune:
            return jsonify({'error': 'Commune non trouvée'}), 404
        return jsonify(commune_service.serialize(commune))
    
    elif request.method == 'PUT':
        data = validate_json_request(request)
        commune = commune_service.model.query.get(id_commune)
        if not commune:
            return jsonify({'error': 'Commune non trouvée'}), 404
        
        commune.libelle = data['nom']
        commune.mnemonique = data['position_x']
        
        db.session.commit()
        return jsonify(commune_service.serialize(commune))
    
    elif request.method == 'DELETE':
        result = commune_service.delete_commune(id_commune)
        return jsonify(result)

@bp.route('/commune', methods=['POST'])
def postCommune():
    """Crée une nouvelle commune"""
    data = validate_json_request(request)
    result = commune_service.create(data)
    return jsonify(result), 201

@bp.route('/communes', methods=['GET'])
def getAllCommunes():
    """Liste toutes les communes (optimisé sans champs volumineux)"""
    return jsonify(commune_service.get_all_optimized())