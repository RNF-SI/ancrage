from flask import request, jsonify
from backend.routes import bp
from backend.services.commune_service import CommuneService
from backend.error_handlers import validate_json_request
from backend.app import db

# Instancier le service
commune_service = CommuneService()

@bp.route('/commune/<int:id_commune>', methods=['GET', 'PUT', 'DELETE'])
def communeMethods(id_commune):
    """Récupère, met à jour ou supprime une commune - REFACTORISÉ gestion erreurs"""
    if request.method == 'GET':
        return jsonify(commune_service.get_by_id_simple(id_commune))
    
    elif request.method == 'PUT':
        data = validate_json_request(request)
        return jsonify(commune_service.update_simple(id_commune, data))
    
    elif request.method == 'DELETE':
        return jsonify(commune_service.delete_commune(id_commune))

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