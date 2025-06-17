from models.models import db
from flask import jsonify
from models.models import *
from schemas.metier import *
from routes import bp
from sqlalchemy.orm import raiseload


@bp.route('/question/<libelle>', methods=['GET'])
def get_question_without_relations(libelle):
    question = db.session.query(Question).options(
        raiseload(Question.reponses),
        raiseload(Question.theme),
        raiseload(Question.choixReponses),
        raiseload(Question.theme_question)
    ).filter_by(libelle=libelle).first()

    schema = QuestionSchema(many=False,exclude = ("reponses", "theme", "choixReponses", "theme_question"))

    questionObj = schema.dump(question)
    return jsonify(questionObj)  