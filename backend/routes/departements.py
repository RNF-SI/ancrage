from flask import request, jsonify
from backend.routes import bp
from backend.services.departement_service import DepartementService
from backend.error_handlers import validate_json_request
from backend.app import db

# Instancier le service
departement_service = DepartementService()

@bp.route('/departement/<int:id_departement>', methods=['GET', 'PUT', 'DELETE'])
def departementMethods(id_departement):
    """Récupère, met à jour ou supprime un département - REFACTORISÉ gestion erreurs"""
    if request.method == 'GET':
        return jsonify(departement_service.get_by_id_simple(id_departement))
    
    elif request.method == 'PUT':
        data = validate_json_request(request)
        return jsonify(departement_service.update_simple(id_departement, data))
    
    elif request.method == 'DELETE':
        return jsonify(departement_service.delete_simple(id_departement))

@bp.route('/departement', methods=['POST'])
def postDepartement():
    """Crée un nouveau département - REFACTORISÉ"""
    data = validate_json_request(request)
    return jsonify(departement_service.create_simple(data)), 201

@bp.route('/departements', methods=['GET'])
def getAllDepartements():
    """Liste tous les départements"""
    return jsonify(departement_service.get_all())

@bp.route('/departements/<mnemonique>', methods=['GET'])
def getAllDepartementsByUSer(mnemonique):
    """Récupère les départements par mnémonique"""
    departements = departement_service.model.query.filter_by(mnemonique=mnemonique).all()
    return jsonify(departement_service.serialize(departements, many=True))