from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp,joinedload,aliased,and_

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
@bp.route('/nomenclatures/<mnemonique>/<int:id_acteur>', methods=['GET'])
def getAllNomenclaturesByType(mnemonique,id_acteur):
    
    if mnemonique == "thème":
        
        ValeurNomenclature = aliased(Nomenclature)
        Categorie = aliased(Nomenclature)
        MotCleAlias = aliased(MotCle)

        nomenclatures = (
            db.session.query(Nomenclature)
            .filter(Nomenclature.mnemonique == "thème")
            .join(Nomenclature.questions)
            .outerjoin(Reponse, and_(
                Reponse.question_id == Question.id_question,
                Reponse.acteur_id == id_acteur
            ))
            .outerjoin(ValeurNomenclature, Reponse.valeur_reponse_id == ValeurNomenclature.id_nomenclature)
            .outerjoin(Reponse.mots_cles)
            .outerjoin(Categorie, MotCle.categories)
            # 🔁 Jointure vers les sous-mots-clés (issus du backref 'mots_cles_issus')
            .outerjoin(MotCleAlias, MotCle.mots_cles_groupe)
            .options(
                joinedload(Nomenclature.questions)
                    .joinedload(Question.reponses)
                    .joinedload(Reponse.valeur_reponse),

                joinedload(Nomenclature.questions)
                    .joinedload(Question.reponses)
                    .joinedload(Reponse.acteur),

                joinedload(Nomenclature.questions)
                    .joinedload(Question.reponses)
                    .joinedload(Reponse.mots_cles)
                    .joinedload(MotCle.categories),

                # ⚡ Chargement des sous-mots-clés
                joinedload(Nomenclature.questions)
                    .joinedload(Question.reponses)
                    .joinedload(Reponse.mots_cles)
                    .joinedload(MotCle.mots_cles_groupe)  # ou .joinedload(MotCle.mots_cles_issus)
            )
            .order_by(Nomenclature.id_nomenclature)
            .all()
        )
                
        return traitementThemeQuestions(nomenclatures,id_acteur)
        
    else:
        nomenclatures = Nomenclature.query.filter_by(mnemonique=mnemonique).all()
        schema = NomenclatureSchema(many=True)
        nomenclatures_data = schema.dump(nomenclatures)
        return jsonify(nomenclatures_data)
            
def getNomenclature(nomenclature):
    schema = NomenclatureSchema(many=False)
    nomenclatureObj = schema.dump(nomenclature)
    return jsonify(nomenclatureObj)

def traitementThemeQuestions(nomenclatures, id_acteur):
    result = []
    for nom in nomenclatures:
        questions_sorted = sorted(nom.questions, key=lambda q: q.id_question)

        questions_data = []
        for q in questions_sorted:
            reponses_possibles = []
            reponses_choisies = []

            for r in q.reponses:
              
                if r.valeur_reponse and (r.acteur_id == id_acteur or r.acteur_id is None):
                    
                    mots_cles_reponse = r.mots_cles
                    reponses_choisies.append({
                        "id_reponse": r.id_reponse,
                        "commentaires": r.commentaires,
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
                                "categories": [
                                    {
                                        "id_nomenclature": cat.id_nomenclature,
                                        "libelle": cat.libelle
                                    }
                                    for cat in mc.categories
                                ],
                                "diagnostic": {
                                    "id_diagnostic": mc.diagnostic.id_diagnostic,
                                    "nom": mc.diagnostic.nom
                                } if mc.diagnostic else None,
                          
                                "mots_cles": [
                                    {
                                        "id_mot_cle": mc_issu.id_mot_cle,
                                        "nom": mc_issu.nom,
                                        "categories": [
                                            {
                                                "id_nomenclature": cat.id_nomenclature,
                                                "libelle": cat.libelle
                                            }
                                            for cat in mc_issu.categories
                                        ],
                                        "diagnostic": {
                                            "id_diagnostic": mc_issu.diagnostic.id_diagnostic,
                                            "nom": mc_issu.diagnostic.nom
                                        } if mc_issu.diagnostic else None
                                    }
                                    for mc_issu in mc.mots_cles_issus
                                ]
                            }
                            for mc in mots_cles_reponse
                        ]
                        
                    })
                        
                    

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
            "questions": questions_data,
            
        })

    return jsonify(result)