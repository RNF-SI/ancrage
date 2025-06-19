from flask import request, jsonify
from backend.routes import bp
from backend.services.acteur_service import ActeurService
from backend.error_handlers import validate_json_request
from werkzeug.exceptions import BadRequest

# Instancier le service
acteur_service = ActeurService()

@bp.route('/acteur/<int:id_acteur>/<slug>', methods=['GET', 'PUT'])
def acteurMethods(id_acteur, slug):
    """Récupère ou met à jour un acteur"""
    if request.method == 'GET':
        result = acteur_service.get_with_relations(id_acteur, slug)
        return jsonify(result)
    
    elif request.method == 'PUT':
        data = validate_json_request(request)
        result = acteur_service.update_with_relations(id_acteur, slug, data)
        return jsonify(result)

@bp.route('/acteur/', methods=['POST'])
def postActeur():
    """Crée un nouvel acteur"""
    data = validate_json_request(request)
    result = acteur_service.create_with_diagnostic(data)
    return jsonify(result), 201

@bp.route('/acteur/state/<int:id_acteur>/<int:id_statut>', methods=['PUT'])
def changeStateInterview(id_acteur, id_statut):
    """Change l'état d'entretien d'un acteur"""
    data = validate_json_request(request)
    modified_by = data.get('modified_by')
    
    if not modified_by:
        raise BadRequest('modified_by requis')
    
    result = acteur_service.change_interview_state(id_acteur, id_statut, modified_by)
    return jsonify(result)

@bp.route('/acteurs/sites', methods=['POST'])
def getAllActeursBySites():
    """Récupère les acteurs liés à des sites"""
    data = validate_json_request(request)
    site_ids = data.get('id_sites')
    
    if not site_ids:
        raise BadRequest("Champ 'id_sites' requis")
    
    result = acteur_service.get_by_sites(site_ids)
    return jsonify(result)

@bp.route('/acteurs/<created_by>', methods=['GET'])
def getAllActeursByUSer(created_by):
    """Récupère les acteurs créés par un utilisateur"""
    return jsonify(acteur_service.get_by_creator(created_by))