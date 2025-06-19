from flask import request, jsonify
from backend.routes import bp
from backend.services.question_service import QuestionService
from backend.app import db
from sqlalchemy.orm import raiseload

# Instancier le service
question_service = QuestionService()

@bp.route('/question/<libelle>', methods=['GET'])
def get_question_without_relations(libelle):
    """Récupère une question sans ses relations - REFACTORISÉ gestion erreurs"""
    return jsonify(question_service.get_by_libelle_no_relations(libelle))

@bp.route('/questions', methods=['GET'])
def getAllQuestions():
    """Liste toutes les questions avec leurs thèmes"""
    return jsonify(question_service.get_all_with_theme())

@bp.route('/questions/theme/<int:theme_id>', methods=['GET'])
def getQuestionsByTheme(theme_id):
    """Récupère les questions d'un thème"""
    return jsonify(question_service.get_by_theme(theme_id))