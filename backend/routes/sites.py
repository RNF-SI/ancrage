from flask import request, jsonify
from backend.routes import bp
from backend.services.site_service import SiteService
from backend.error_handlers import validate_json_request

# Instancier le service
site_service = SiteService()

@bp.route('/sites', methods=['GET'])
def getAllSites():
    """Liste tous les sites"""
    return jsonify(site_service.get_all())

@bp.route('/site/<int:id_site>/<slug>', methods=['GET', 'PUT', 'DELETE'])
def siteMethods(id_site, slug):
    """Récupère, met à jour ou supprime un site"""
    if request.method == 'GET':
        result = site_service.get_with_relations(id_site, slug)
        return jsonify(result)
    
    elif request.method == 'PUT':
        data = validate_json_request(request)
        result = site_service.update_with_relations(id_site, slug, data)
        return jsonify(result)
    
    elif request.method == 'DELETE':
        result = site_service.delete(id_site, slug)
        return jsonify(result)

@bp.route('/site/', methods=['POST'])
def postSite():
    """Crée un nouveau site"""
    data = validate_json_request(request)
    result = site_service.create(data)
    return jsonify(result), 201

@bp.route('/sites/<created_by>', methods=['GET'])
def getAllSitesByUSer(created_by):
    """Récupère les sites d'un utilisateur créateur via les diagnostics"""
    return jsonify(site_service.get_by_creator(created_by))