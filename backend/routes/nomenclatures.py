from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from sqlalchemy.orm import joinedload,aliased
from sqlalchemy import or_
from routes import bp

@bp.route('/nomenclature/<int:id_nomenclature>', methods=['GET','PUT','DELETE'])
def nomenclatureMethods(id_nomenclature):
    nomenclature = Nomenclature.query.filter_by(id_nomenclature=id_nomenclature).first()
    
    print(nomenclature)
    if request.method == 'GET':

       return getNomenclature(nomenclature)
    
@bp.route('/nomenclature/<string:valeur>', methods=['GET','PUT','DELETE'])
def nomenclatureNoResponse(valeur):
    nomenclature = Nomenclature.query.filter_by(libelle=valeur).first()
    
    print(nomenclature)
    if request.method == 'GET':

       return getNomenclature(nomenclature)

@bp.route('/nomenclatures',methods=['GET'])
def getAllNomenclatures():
    if request.method == 'GET': 
        
        nomenclatures = Nomenclature.query.filter_by().all()
        schema = NomenclatureSchema(many=True)
        usersObj = schema.dump(nomenclatures)
        return jsonify(usersObj)

@bp.route('/nomenclatures/<mnemonique>', defaults={'id_acteur': None},methods=['GET'])
@bp.route('/nomenclatures/<mnemonique>/<id_acteur>', methods=['GET'])
def getAllNomenclaturesByType(mnemonique,id_acteur):
    
    if mnemonique == "thème":
        if id_acteur != None:

            ValeurNomenclature = aliased(Nomenclature)

            nomenclatures = (
                db.session.query(Nomenclature)
                .filter(Nomenclature.mnemonique == "thème")
                .order_by(Nomenclature.id_nomenclature)
                .outerjoin(Nomenclature.questions)
                .outerjoin(Question.reponses)
                .outerjoin(ValeurNomenclature, Reponse.valeur_reponse)
                .options(
                    joinedload(Nomenclature.questions)
                    .joinedload(Question.reponses)
                    .joinedload(Reponse.valeur_reponse),
                    joinedload(Nomenclature.questions)
                    .joinedload(Question.reponses)
                    .joinedload(Reponse.acteur)
                )
                .all()
            )
        else:
            nomenclatures = (
                db.session.query(Nomenclature)
                .filter(Nomenclature.mnemonique == "thème")
                .options(
                    joinedload(Nomenclature.questions)
                    .joinedload(Question.reponses)
                )
                .all()
            )
        if id_acteur and nomenclatures == []:
             nomenclatures = (
                db.session.query(Nomenclature)
                .filter(Nomenclature.mnemonique == "thème")
                .filter(Reponse.acteur.id_acteur == id_acteur)
                .options(
                    joinedload(Nomenclature.questions)
                    .joinedload(Question.reponses)
                )
                .all()
            )

        return traitementThemeQuestions(nomenclatures,id_acteur)
        
    else:
        nomenclatures = Nomenclature.query.filter_by(mnemonique=mnemonique).all()
        schema = NomenclatureSchema(many=True)
        nomenclatures_data = schema.dump(nomenclatures)
        return jsonify(nomenclatures_data)
    
@bp.route('/nomenclatures/theme/<libelle>/<int:id_acteur>', methods=['GET'])
def getTheme(libelle,id_acteur):
    
    ValeurNomenclature = aliased(Nomenclature)

    nomenclatures = (
        db.session.query(Nomenclature)
        .filter(Nomenclature.libelle == libelle)
        .order_by(Nomenclature.id_nomenclature)
        .outerjoin(Nomenclature.questions)
        .outerjoin(Question.reponses)
        .filter(
            or_(
                Reponse.acteur_id == id_acteur,
                Reponse.acteur_id == None  # pour conserver les choix possibles sans acteur
            )
        )
        .outerjoin(ValeurNomenclature, Reponse.valeur_reponse)
        .options(
            joinedload(Nomenclature.questions)
            .joinedload(Question.reponses)
            .joinedload(Reponse.valeur_reponse),
            joinedload(Nomenclature.questions)
            .joinedload(Question.reponses)
            .joinedload(Reponse.acteur)
        )
        .all()
    )
    if id_acteur and nomenclatures == []:
             nomenclatures = (
                db.session.query(Nomenclature)
                .filter(Nomenclature.libelle == libelle)
                .options(
                    joinedload(Nomenclature.questions)
                    .joinedload(Question.reponses)
                )
                .all()
            )
    
    return traitementThemeQuestions(nomenclatures,id_acteur)
    
def getNomenclature(nomenclature):
    schema = NomenclatureSchema(many=False)
    nomenclatureObj = schema.dump(nomenclature)
    return jsonify(nomenclatureObj)

def traitementThemeQuestions(nomenclatures,id_acteur):
    result = []
    for nom in nomenclatures:
            # Tri des questions par ID
            questions_sorted = sorted(nom.questions, key=lambda q: q.id_question)

            questions_data = []
            for q in questions_sorted:
                reponses_possibles = []
                reponses_choisies = []

                for r in q.reponses:
                    if r.valeur_reponse and (r.acteur_id == id_acteur or r.acteur_id is None):
                        rep_obj = {
                            "id_nomenclature": r.valeur_reponse.id_nomenclature,
                            "libelle": r.valeur_reponse.libelle,
                            "value": r.valeur_reponse.value
                        }

                        if r.acteur_id:
                            reponses_choisies.append({
                               "id_reponse": r.id_reponse,
                               "commentaires":r.commentaires,
                                "acteur": {
                                    "id_acteur": r.acteur.id_acteur,
                                    "nom": r.acteur.nom,
                                    "prenom": r.acteur.prenom,
                                    "fonction": r.acteur.fonction,
                                    "telephone": r.acteur.telephone,
                                    "mail": r.acteur.mail,
                                    "structure": r.acteur.structure,
                                },
                                "question": {
                                    "id_question": r.question.id_question,
                                    "libelle": r.question.libelle,
                                    "indications": r.question.indications
                                } if r.question else None,
                                "valeur_reponse": {
                                    "id_nomenclature": r.valeur_reponse.id_nomenclature if r.valeur_reponse else 0,
                                    "libelle": r.valeur_reponse.libelle if r.valeur_reponse else '',
                                    "value": r.valeur_reponse.value if r.valeur_reponse else 1,
                                    "mnemonique": r.valeur_reponse.mnemonique if r.valeur_reponse else ''
                                },

                                "mots_cles": [
                                    {
                                        "id_mot_cle": mc.id_mot_cle,
                                        "nom": mc.nom,
                                        "categorie": {
                                            "id_nomenclature": mc.categorie.id_nomenclature,
                                            "libelle": mc.categorie.libelle if mc.categorie else None
                                        },
                                        "diagnostic": {
                                            "id_diagnostic": mc.diagnostic.id_diagnostic,
                                            "nom": mc.diagnostic.nom
                                        } if mc.diagnostic else None
                                    }
                                    for mc in r.mots_cles
                                ] 
                            })
                        else:
                            reponses_possibles.append(rep_obj)

                questions_data.append({
                    "id_question": q.id_question,
                    "libelle": q.libelle,
                    "indications": q.indications,
                    "choixReponses": sorted(reponses_possibles, key=lambda x: x["value"]),
                    "reponses": reponses_choisies
                })

            result.append({
                "id_nomenclature": nom.id_nomenclature,
                "libelle": nom.libelle,
                "mnemonique": nom.mnemonique,
                "questions": questions_data
            })

    return jsonify(result)