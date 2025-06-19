from flask import request, jsonify
from backend.routes import bp
from backend.services.departement_service import DepartementService
from backend.error_handlers import validate_json_request
from backend.app import db

# Instancier le service
departement_service = DepartementService()

@bp.route('/departement/<int:id_departement>', methods=['GET', 'PUT', 'DELETE'])
def departementMethods(id_departement):
    """Récupère, met à jour ou supprime un département"""
    if request.method == 'GET':
        departement = departement_service.model.query.get(id_departement)
        if not departement:
            return jsonify({'error': 'Département non trouvé'}), 404
        return jsonify(departement_service.serialize(departement))
    
    elif request.method == 'PUT':
        data = validate_json_request(request)
        departement = departement_service.model.query.get(id_departement)
        if not departement:
            return jsonify({'error': 'Département non trouvé'}), 404
        
        departement.libelle = data['nom']
        departement.mnemonique = data['position_x']
        
        db.session.commit()
        return jsonify(departement_service.serialize(departement))
    
    elif request.method == 'DELETE':
        departement = departement_service.model.query.get(id_departement)
        if not departement:
            return jsonify({'error': 'Département non trouvé'}), 404
        
        db.session.delete(departement)
        db.session.commit()
        return {"success": "Suppression terminée"}

@bp.route('/departement', methods=['POST'])
def postDepartement():
    """Crée un nouveau département"""
    data = validate_json_request(request)
    
    departement = departement_service.model()
    departement.libelle = data['nom']
    departement.mnemonique = data['position_x']
    
    db.session.add(departement)
    db.session.commit()
    
    return jsonify(departement_service.serialize(departement)), 201

@bp.route('/departements', methods=['GET'])
def getAllDepartements():
    """Liste tous les départements"""
    return jsonify(departement_service.get_all())

@bp.route('/departements/<mnemonique>', methods=['GET'])
def getAllDepartementsByUSer(mnemonique):
    """Récupère les départements par mnémonique"""
    departements = departement_service.model.query.filter_by(mnemonique=mnemonique).all()
    return jsonify(departement_service.serialize(departements, many=True))