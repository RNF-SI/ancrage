from flask import jsonify
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from werkzeug.exceptions import HTTPException, BadRequest as WerkzeugBadRequest, NotFound as WerkzeugNotFound, Unauthorized as WerkzeugUnauthorized
from backend.routes.logger_config import setup_logger

logger = setup_logger("error_handler")

def register_error_handlers(app):
    """Enregistre tous les gestionnaires d'erreurs pour l'application"""
    
    @app.errorhandler(404)
    def not_found(error):
        logger.warning(f"404 - Ressource non trouvée: {error}")
        return jsonify({
            'error': 'Ressource non trouvée',
            'message': str(error.description) if hasattr(error, 'description') else 'La ressource demandée n\'existe pas'
        }), 404
    
    @app.errorhandler(400)
    def bad_request(error):
        logger.warning(f"400 - Requête invalide: {error}")
        return jsonify({
            'error': 'Requête invalide',
            'message': str(error.description) if hasattr(error, 'description') else 'La requête est mal formée'
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        logger.warning(f"401 - Non autorisé: {error}")
        return jsonify({
            'error': 'Non autorisé',
            'message': 'Authentification requise'
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        logger.warning(f"403 - Accès interdit: {error}")
        return jsonify({
            'error': 'Accès interdit',
            'message': 'Vous n\'avez pas les permissions nécessaires'
        }), 403
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"500 - Erreur serveur: {error}")
        return jsonify({
            'error': 'Erreur serveur',
            'message': 'Une erreur interne s\'est produite. Veuillez réessayer plus tard.'
        }), 500
    
    @app.errorhandler(IntegrityError)
    def integrity_error(error):
        logger.error(f"Erreur d'intégrité DB: {error}")
        return jsonify({
            'error': 'Erreur de données',
            'message': 'Les données soumises violent les contraintes de la base de données'
        }), 400
    
    @app.errorhandler(SQLAlchemyError)
    def database_error(error):
        logger.error(f"Erreur SQLAlchemy: {error}")
        return jsonify({
            'error': 'Erreur base de données',
            'message': 'Une erreur est survenue lors de l\'accès à la base de données'
        }), 500
    
    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        logger.warning(f"HTTPException {error.code}: {error}")
        return jsonify({
            'error': error.name,
            'message': error.description
        }), error.code
    
    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        logger.error(f"Erreur inattendue: {error}", exc_info=True)
        return jsonify({
            'error': 'Erreur inattendue',
            'message': 'Une erreur inattendue s\'est produite'
        }), 500

def validate_json_request(request):
    """Valide que la requête contient du JSON valide"""
    if not request.is_json:
        logger.warning("Requête sans Content-Type: application/json")
        raise BadRequest('Content-Type doit être application/json')
    
    data = request.get_json()
    if data is None:
        logger.warning("JSON invalide dans la requête")
        raise BadRequest('JSON invalide')
    
    return data

class BadRequest(WerkzeugBadRequest):
    """Exception personnalisée pour les requêtes invalides"""
    pass

class NotFound(WerkzeugNotFound):
    """Exception personnalisée pour les ressources non trouvées"""
    pass

class Unauthorized(WerkzeugUnauthorized):
    """Exception personnalisée pour les accès non autorisés"""
    pass

class ValidationError(WerkzeugBadRequest):
    """Exception pour les erreurs de validation"""
    pass

class DatabaseError(HTTPException):
    """Exception pour les erreurs de base de données"""
    code = 500
    description = "Erreur de base de données"