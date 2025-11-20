"""
Route de debug pour vérifier les cookies et la session
"""
from flask import request, jsonify, session
from flask_login import current_user
from routes import bp
from configs.logger_config import logger


@bp.route('/debug/cookies', methods=['GET'])
def debug_cookies():
    """
    Route de debug pour voir tous les cookies et informations de session
    """
    cookies_received = dict(request.cookies)
    session_data = dict(session) if session else {}
    
    try:
        user_info = {
            'is_authenticated': current_user.is_authenticated if current_user else False,
            'id_role': getattr(current_user, 'id_role', None) if current_user else None,
            'username': getattr(current_user, 'username', None) if current_user else None,
        }
    except Exception as e:
        user_info = {'error': str(e)}
    
    debug_info = {
        'cookies_received': cookies_received,
        'session_keys': list(session_data.keys()),
        'session_data': {k: str(v) for k, v in session_data.items()},
        'user_info': user_info,
        'headers': {
            'cookie': request.headers.get('Cookie', 'Aucun cookie dans les headers'),
            'authorization': request.headers.get('Authorization', 'Aucune autorisation'),
        },
        'remote_addr': request.remote_addr,
    }
    
    logger.info(f"🔍 Debug cookies - Cookies: {list(cookies_received.keys())}, Session: {list(session_data.keys())}")
    
    return jsonify(debug_info), 200

