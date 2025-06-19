from flask import request, jsonify
from backend.routes import bp
from backend.services.region_service import RegionService
from backend.error_handlers import validate_json_request
from backend.app import db

# Instancier le service
region_service = RegionService()

@bp.route('/region/<int:id_region>', methods=['GET', 'PUT', 'DELETE'])
def regionMethods(id_region):
    """Récupère, met à jour ou supprime une région - REFACTORISÉ"""
    if request.method == 'GET':
        return jsonify(region_service.get_by_id_simple(id_region))
    
    elif request.method == 'PUT':
        data = validate_json_request(request)
        return jsonify(region_service.update_simple(id_region, data))
    
    elif request.method == 'DELETE':
        return jsonify(region_service.delete_simple(id_region))

@bp.route('/region', methods=['POST'])
def postRegion():
    """Crée une nouvelle région - REFACTORISÉ"""
    data = validate_json_request(request)
    return jsonify(region_service.create_simple(data)), 201

@bp.route('/regions', methods=['GET'])
def getAllRegions():
    """Liste toutes les régions"""
    return jsonify(region_service.get_all())

@bp.route('/regions/<mnemonique>', methods=['GET'])
def getAllRegionsByUSer(mnemonique):
    """Récupère les régions par mnémonique - REFACTORISÉ"""
    return jsonify(region_service.get_by_mnemonique(mnemonique))