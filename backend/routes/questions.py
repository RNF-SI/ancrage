from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp,date_time
from sqlalchemy.orm import joinedload

@bp.route('/question/<id_question>', methods=['GET','PUT','DELETE'])
def questionMethods(id_question):
    question = Question.query.filter_by(id_question=id_question).first()
    
    print(question)
    if request.method == 'GET':

       return getQuestion(question)
    
    
    elif request.method == 'PUT':
        data = request.get_json()
        question = changeValuesQuestion(question,data)

        db.session.commit()
        return getQuestion(question)

    elif request.method == 'DELETE':

        db.session.delete(question)
        db.session.commit()
        return {"success": "Suppression terminée"}
    
@bp.route('/question',methods=['POST'])
def postQuestion():
    if request.method == 'POST': 
        
        data = request.get_json()
        print(data)
        question=Question()
        question = changeValuesQuestion(question,data)
        db.session.add(question)
        db.session.commit()
        return getQuestion(question)

@bp.route('/questions',methods=['GET'])
def getAllQuestions():
    if request.method == 'GET': 
        
         questions = (
        db.session.query(Question)
        .options(
            joinedload(Question.theme),  # charge le thème (Nomenclature)
            joinedload(Question.reponses).joinedload(Reponse.valeur_reponse)  # charge les réponses + nomenclatures
        )
        .all()
    )

    result = []

    for q in questions:
        reponses_possibles = []
        for r in q.reponses:
            if r.valeur_reponse:
                reponses_possibles.append({
                    "libelle": r.valeur_reponse.libelle,
                    "value": r.valeur_reponse.value
                })

        result.append({
            "id_question": q.id_question,
            "libelle": q.libelle,
            "theme": {
                "id": q.theme.id_nomenclature,
                "libelle": q.theme.libelle,
                "mnemonique": q.theme.mnemonique
            } if q.theme else None,
            "reponses_possibles": sorted(reponses_possibles, key=lambda x: x["value"])
        })

    return jsonify(result)
    
@bp.route('/questions/<mnemonique>',methods=['GET'])
def getAllQuestionsByUSer(mnemonique):
    if request.method == 'GET': 
        
        questions = Question.query.filter_by(mnemonique=mnemonique).all()
        schema = QuestionSchema(many=True)
        questionsObj = schema.dump(questions)
        return jsonify(questionsObj)
    
def changeValuesQuestion(question,data):
    
    question.libelle = data['nom']
    question.mnemonique = data['position_x']
    
    return question

def getQuestion(question):
    schema = QuestionSchema(many=False)
    questionObj = schema.dump(question)
    return jsonify(questionObj)


    