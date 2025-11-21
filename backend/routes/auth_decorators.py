"""
Décorateurs personnalisés pour l'authentification stricte
"""
from functools import wraps
from flask import request, jsonify, session
from flask_login import current_user
from configs.logger_config import logger

try:
    from flask_login import login_required
except ImportError:
    login_required = None


def require_auth(f):
    """
    Décorateur qui vérifie explicitement que l'utilisateur est authentifié.
    Plus strict que check_auth car il vérifie vraiment l'authentification.
    
    Vérifie :
    1. Que current_user existe et est authentifié (Flask-Login)
    2. Que la session contient un utilisateur valide
    3. Que l'utilisateur a un id_role valide
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Log des cookies reçus pour diagnostic
        cookies_received = dict(request.cookies)
        logger.info(f"🍪 Cookies reçus pour {request.path}: {list(cookies_received.keys())}")
        
        # Log de la session Flask
        session_keys = list(session.keys()) if session else []
        logger.info(f"📋 Clés de session Flask: {session_keys}")
        
        # Vérifier que current_user existe
        try:
            user_authenticated = current_user and hasattr(current_user, 'is_authenticated') and current_user.is_authenticated
        except Exception as e:
            logger.warning(f"Erreur lors de la vérification de current_user: {e}")
            user_authenticated = False
        
        # Vérifier aussi la session Flask
        session_user = session.get('_user_id') or session.get('user_id')
        
        # BLOQUER si pas d'authentification - vérification stricte
        if not user_authenticated and not session_user:
            logger.warning(
                f"🚫 BLOQUÉ: Tentative d'accès non autorisé à {request.path} depuis {request.remote_addr}. "
                f"current_user.is_authenticated={user_authenticated}, session_user={session_user}, "
                f"cookies={list(cookies_received.keys())}"
            )
            return jsonify({
                'error': 'Authentification requise',
                'message': 'Vous devez être connecté pour accéder à cette ressource',
                'code': 'UNAUTHORIZED',
                'debug': {
                    'cookies_received': list(cookies_received.keys()),
                    'session_keys': session_keys,
                    'user_authenticated': user_authenticated,
                    'session_user': session_user is not None
                }
            }), 401
        
        # Si current_user existe, vérifier qu'il a un id_role valide
        if user_authenticated:
            if not hasattr(current_user, 'id_role') or current_user.id_role is None:
                logger.warning(f"Utilisateur sans id_role tentant d'accéder à {request.path}")
                return jsonify({
                    'error': 'Authentification invalide',
                    'message': 'Session utilisateur invalide',
                    'code': 'INVALID_SESSION'
                }), 401
            
            logger.debug(f"Accès autorisé pour l'utilisateur {current_user.id_role} à {request.path}")
        else:
            logger.debug(f"Accès autorisé via session pour {request.path}")
        
        return f(*args, **kwargs)
    
    return decorated_function

