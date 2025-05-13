from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from sqlalchemy.orm import joinedload
from routes import bp,date_time

@bp.route('/nomenclature/<id_nomenclature>', methods=['GET','PUT','DELETE'])
def nomenclatureMethods(id_nomenclature):
    nomenclature = Nomenclature.query.filter_by(id_nomenclature=id_nomenclature).first()
    
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
    
@bp.route('/nomenclatures/<mnemonique>', methods=['GET'])
def getAllNomenclaturesByType(mnemonique):
    if mnemonique == "thème":
        nomenclatures = (
            db.session.query(Nomenclature)
            .filter(Nomenclature.mnemonique == "thème")
            .options(
                joinedload(Nomenclature.questions)
                .joinedload(Question.reponses)
                .joinedload(Reponse.valeur_reponse)
            )
            .all()
        )

        # Tri des thèmes par libellé (ou par ID si souhaité)
        nomenclatures_sorted = sorted(nomenclatures, key=lambda n: n.libelle or "")

        result = []
        for nom in nomenclatures_sorted:
            # Tri des questions par ID
            questions_sorted = sorted(nom.questions, key=lambda q: q.id_question)

            questions_data = []
            for q in questions_sorted:
                reponses_possibles = []
                reponses_choisies = []

                for r in q.reponses:
                    if r.valeur_reponse:
                        rep_obj = {
                            "id_nomenclature": r.valeur_reponse.id_nomenclature,
                            "libelle": r.valeur_reponse.libelle,
                            "value": r.valeur_reponse.value
                        }

                        if r.acteur_id:
                            reponses_choisies.append({
                                "acteur_id": r.acteur_id,
                                **rep_obj
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

    else:
        nomenclatures = Nomenclature.query.filter_by(mnemonique=mnemonique).all()
        schema = NomenclatureSchema(many=True)
        nomenclatures_data = schema.dump(nomenclatures)
        return jsonify(nomenclatures_data)
    
def getNomenclature(nomenclature):
    schema = NomenclatureSchema(many=False)
    nomenclatureObj = schema.dump(nomenclature)
    return jsonify(nomenclatureObj)


    