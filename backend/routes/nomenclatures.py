from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp,joinedload,aliased,and_
from collections import defaultdict
from backend.services.nomenclature_service import NomenclatureService

# Instancier le service
nomenclature_service = NomenclatureService()

@bp.route('/nomenclature/<int:id_nomenclature>', methods=['GET','PUT','DELETE'])
def nomenclatureMethods(id_nomenclature):
    """Gestion d'une nomenclature par ID - REFACTORISÉ"""
    if request.method == 'GET':
        return jsonify(nomenclature_service.get_by_id(id_nomenclature))
    
@bp.route('/nomenclature/<string:valeur>', methods=['GET','PUT','DELETE'])
def nomenclatureNoResponse(valeur):
    """Gestion d'une nomenclature par libellé - REFACTORISÉ"""
    if request.method == 'GET':
        return jsonify(nomenclature_service.get_by_libelle(valeur))

@bp.route('/nomenclatures',methods=['GET'])
def getAllNomenclatures():
    """Liste toutes les nomenclatures - REFACTORISÉ"""
    if request.method == 'GET': 
        return jsonify(nomenclature_service.get_all())

@bp.route('/nomenclatures/<mnemonique>', defaults={'id_acteur': None},methods=['GET'])
@bp.route('/nomenclatures/<mnemonique>/<int:id_acteur>', methods=['GET'])
def getAllNomenclaturesByType(mnemonique,id_acteur):
    
    if mnemonique == "thème" and id_acteur:

        ValeurNomenclature = aliased(Nomenclature)
        Categorie = aliased(Nomenclature)
        MotCleAlias = aliased(MotCle)

        nomenclatures = (
            db.session.query(Nomenclature)
            .filter(Nomenclature.libelle == "AFOM")
            .join(Nomenclature.questions)
            .outerjoin(Reponse, and_(
                Reponse.question_id == Question.id_question,
                Reponse.acteur_id == id_acteur
            ))
            .outerjoin(ValeurNomenclature, Reponse.valeur_reponse_id == ValeurNomenclature.id_nomenclature)
            .outerjoin(Reponse.mots_cles)
            .outerjoin(Categorie, MotCle.categorie)
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
                    .joinedload(MotCle.categorie),

                joinedload(Nomenclature.questions)
                    .joinedload(Question.reponses)
                    .joinedload(Reponse.mots_cles)
                    .joinedload(MotCle.mots_cles_groupe),

                # 👇 Chargement des réponses possibles
                joinedload(Nomenclature.questions)
                    .joinedload(Question.choixReponses)
            )
            .order_by(Nomenclature.id_nomenclature)
            .all()
        )
                        
        return traitementThemeQuestions(nomenclatures,id_acteur)
    
    elif mnemonique == "thème":

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
            .outerjoin(Categorie, MotCle.categorie)
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
                    .joinedload(MotCle.categorie),

                joinedload(Nomenclature.questions)
                    .joinedload(Question.reponses)
                    .joinedload(Reponse.mots_cles)
                    .joinedload(MotCle.mots_cles_groupe),

                # 👇 Chargement des réponses possibles
                joinedload(Nomenclature.questions)
                    .joinedload(Question.choixReponses)
            )
            .order_by(Nomenclature.id_nomenclature)
            .all()
        )
                        
        return traitementThemeQuestions(nomenclatures,id_acteur)
    
    elif mnemonique == "thème_question":
        ValeurNomenclature = aliased(Nomenclature)
        Categorie = aliased(Nomenclature)
        MotCleAlias = aliased(MotCle)

        nomenclatures = (
        db.session.query(Nomenclature)
        .filter(Nomenclature.mnemonique == "thème_question") 
        .join(Nomenclature.questions_th)  
        .outerjoin(Reponse, and_(
            Reponse.question_id == Question.id_question,
            Reponse.acteur_id == id_acteur
        ))
        .outerjoin(ValeurNomenclature, Reponse.valeur_reponse_id == ValeurNomenclature.id_nomenclature)
        .outerjoin(Reponse.mots_cles)
        .outerjoin(Categorie, MotCle.categorie)
        .outerjoin(MotCleAlias, MotCle.mots_cles_groupe)
        .options(
            joinedload(Nomenclature.questions_th)
                .joinedload(Question.reponses)
                .joinedload(Reponse.valeur_reponse),

            joinedload(Nomenclature.questions_th)
                .joinedload(Question.reponses)
                .joinedload(Reponse.acteur),

            joinedload(Nomenclature.questions_th)
                .joinedload(Question.reponses)
                .joinedload(Reponse.mots_cles)
                .joinedload(MotCle.categorie),

            joinedload(Nomenclature.questions_th)
                .joinedload(Question.reponses)
                .joinedload(Reponse.mots_cles)
                .joinedload(MotCle.mots_cles_groupe),

            joinedload(Nomenclature.questions_th)
                .joinedload(Question.choixReponses)
        )
        .order_by(Nomenclature.id_nomenclature)
        .all()
    )

        return traitementParThemeQuestions(nomenclatures, id_acteur)
    else:
        # Cas simple - utilisation du service
        return jsonify(nomenclature_service.get_by_mnemonique(mnemonique))
            
def getNomenclature(nomenclature):
    """Helper de sérialisation - REFACTORISÉ"""
    return jsonify(nomenclature_service.serialize(nomenclature))

def traitementThemeQuestions(nomenclatures, id_acteur): 
    result = []
    for nom in nomenclatures:
        questions_sorted = sorted(nom.questions, key=lambda q: q.id_question)
        questions_data = []

        for q in questions_sorted:
            reponses_possibles = []
            reponse_acteur = None 

            for val in q.choixReponses:
                reponses_possibles.append({
                    "id_nomenclature": val.id_nomenclature,
                    "libelle": val.libelle,
                    "value": val.value,
                    "mnemonique": val.mnemonique
                })

            for r in q.reponses:
                if r.acteur_id == id_acteur:
                    mots_cles_reponse = r.mots_cles
                    reponse_acteur = {
                        "id_reponse": r.id_reponse,
                        "commentaires": r.commentaires,
                        "valeur_reponse": {
                            "id_nomenclature": r.valeur_reponse.id_nomenclature,
                            "libelle": r.valeur_reponse.libelle,
                            "value": r.valeur_reponse.value,
                            "mnemonique": r.valeur_reponse.mnemonique
                        } if r.valeur_reponse else None,
                        "acteur": {
                            "id_acteur": r.acteur.id_acteur,
                            "nom": r.acteur.nom,
                            "prenom": r.acteur.prenom,
                            "fonction": r.acteur.fonction,
                            "telephone": r.acteur.telephone,
                        } if r.acteur else None,
                        "question": {
                            "id_question": q.id_question,
                            "libelle": q.libelle,
                            "indications": q.indications,
                            "theme_question": {
                                "id_nomenclature": q.theme_question.id_nomenclature,
                                "libelle": q.theme_question.libelle,
                                "mnemonique": q.theme_question.mnemonique
                            } if q.theme_question else None,
                        },
                        "mots_cles": [
                            {
                                "id_mot_cle": mc.id_mot_cle,
                                "nom": mc.nom,
                                "categorie": ([{
                                    "id_nomenclature": mc.categorie.id_nomenclature,
                                    "libelle": mc.categorie.libelle
                                }] if mc.categorie else []),
                                "diagnostic": {
                                    "id_diagnostic": mc.diagnostic.id_diagnostic,
                                    "nom": mc.diagnostic.nom
                                } if mc.diagnostic else None,
                                "mots_cles": [
                                    {
                                        "id_mot_cle": mc_issu.id_mot_cle,
                                        "nom": mc_issu.nom,
                                        "categorie": ([{
                                            "id_nomenclature": mc_issu.categorie.id_nomenclature,
                                            "libelle": mc_issu.categorie.libelle
                                        }] if mc_issu.categorie else []),
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
                    }
                    break

            questions_data.append({
                "id_question": q.id_question,
                "libelle": q.libelle,
                "indications": q.indications,
                "choixReponses": sorted(reponses_possibles, key=lambda x: x["value"]),
                "reponses": [reponse_acteur] if reponse_acteur else []
            })

        result.append({
            "id_nomenclature": nom.id_nomenclature,
            "libelle": nom.libelle,
            "mnemonique": nom.mnemonique,
            "questions": questions_data,
        })

    return result


def traitementParThemeQuestions(nomenclatures, id_acteur):
    result = []

    for theme in sorted(nomenclatures, key=lambda t: t.id_nomenclature):
        questions_data = []

        for q in sorted(theme.questions_th, key=lambda x: x.ordre if x.ordre is not None else 0):
            reponses_possibles = [
                {
                    "id_nomenclature": val.id_nomenclature,
                    "libelle": val.libelle,
                    "value": val.value,
                    "mnemonique": val.mnemonique
                }
                for val in q.choixReponses
            ]

            reponse_acteur = None
            for r in q.reponses:
                if r.acteur_id == id_acteur:
                    mots_cles_reponse = r.mots_cles
                    reponse_acteur = {
                        "id_reponse": r.id_reponse,
                        "commentaires": r.commentaires,
                        "valeur_reponse": {
                            "id_nomenclature": r.valeur_reponse.id_nomenclature,
                            "libelle": r.valeur_reponse.libelle,
                            "value": r.valeur_reponse.value,
                            "mnemonique": r.valeur_reponse.mnemonique
                        } if r.valeur_reponse else None,
                        "acteur": {
                            "id_acteur": r.acteur.id_acteur,
                            "nom": r.acteur.nom,
                            "prenom": r.acteur.prenom,
                            "fonction": r.acteur.fonction,
                            "telephone": r.acteur.telephone,
                        } if r.acteur else None,
                        "question": {
                            "id_question": q.id_question,
                            "libelle": q.libelle,
                            "indications": q.indications,
                        },
                        "mots_cles": [
                            {
                                "id_mot_cle": mc.id_mot_cle,
                                "nom": mc.nom,
                                "categorie": ([{
                                    "id_nomenclature": mc.categorie.id_nomenclature,
                                    "libelle": mc.categorie.libelle
                                }] if mc.categorie else []),
                                "diagnostic": {
                                    "id_diagnostic": mc.diagnostic.id_diagnostic,
                                    "nom": mc.diagnostic.nom
                                } if mc.diagnostic else None,
                                "mots_cles": [
                                    {
                                        "id_mot_cle": mc_issu.id_mot_cle,
                                        "nom": mc_issu.nom,
                                        "categorie": ([{
                                            "id_nomenclature": mc_issu.categorie.id_nomenclature,
                                            "libelle": mc_issu.categorie.libelle
                                        }] if mc_issu.categorie else []),
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
                    }
                    break

            questions_data.append({
                "id_question": q.id_question,
                "libelle": q.libelle,
                "indications": q.indications,
                "choixReponses": sorted(reponses_possibles, key=lambda x: x["value"]),
                "reponses": [reponse_acteur] if reponse_acteur else []
            })

        result.append({
            "id_nomenclature": theme.id_nomenclature,
            "libelle": theme.libelle,
            "mnemonique": theme.mnemonique,
            "questions": questions_data
        })

    return result