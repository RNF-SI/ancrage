from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp, joinedload, aliased, and_
from routes.logger_config import logger

@bp.route('/nomenclature/<int:id_nomenclature>', methods=['GET', 'PUT', 'DELETE'])
def nomenclatureMethods(id_nomenclature):
    logger.info(f"📋 Requête {request.method} - Nomenclature ID={id_nomenclature}")
    nomenclature = Nomenclature.query.filter_by(id_nomenclature=id_nomenclature).first()

    if not nomenclature:
        logger.warning(f"❌ Nomenclature ID={id_nomenclature} non trouvée")
        return jsonify({'error': 'Nomenclature non trouvée'}), 404

    if request.method == 'GET':
        logger.info(f"📤 Envoi des données de la nomenclature ID={id_nomenclature}")
        return getNomenclature(nomenclature)

@bp.route('/nomenclature/<string:valeur>', methods=['GET', 'PUT', 'DELETE'])
def nomenclatureNoResponse(valeur):
    logger.info(f"📋 Requête {request.method} - Nomenclature libellé='{valeur}'")
    nomenclature = Nomenclature.query.filter_by(libelle=valeur).first()

    if not nomenclature:
        logger.warning(f"❌ Nomenclature libellé='{valeur}' non trouvée")
        return jsonify({'error': 'Nomenclature non trouvée'}), 404

    if request.method == 'GET':
        logger.info(f"📤 Envoi des données de la nomenclature libellé='{valeur}'")
        return getNomenclature(nomenclature)

@bp.route('/nomenclatures', methods=['GET'])
def getAllNomenclatures():
    logger.info("📋 Requête GET - Récupération de toutes les nomenclatures")
    nomenclatures = Nomenclature.query.all()
    logger.debug(f"🔍 {len(nomenclatures)} nomenclatures récupérées")
    schema = NomenclatureSchema(many=True)
    return jsonify(schema.dump(nomenclatures))

@bp.route('/nomenclatures/<mnemonique>', defaults={'id_acteur': None}, methods=['GET'])
@bp.route('/nomenclatures/<mnemonique>/<int:id_acteur>', methods=['GET'])
def getAllNomenclaturesByType(mnemonique, id_acteur):
    logger.info(f"📋 Requête GET - Nomenclatures par mnemonique='{mnemonique}', acteur={id_acteur}")

    if mnemonique == "thème":
        logger.info("🔍 Traitement des thèmes avec jointures complexes")
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

                joinedload(Nomenclature.questions)
                    .joinedload(Question.reponses)
                    .joinedload(Reponse.mots_cles)
                    .joinedload(MotCle.mots_cles_groupe),

                joinedload(Nomenclature.questions)
                    .joinedload(Question.choixReponses)
            )
            .order_by(Nomenclature.id_nomenclature)
            .all()
        )

        logger.debug(f"🔎 {len(nomenclatures)} nomenclatures 'thème' trouvées")
        return traitementThemeQuestions(nomenclatures, id_acteur)

    else:
        nomenclatures = Nomenclature.query.filter_by(mnemonique=mnemonique).all()
        logger.debug(f"🔎 {len(nomenclatures)} nomenclatures avec mnemonique='{mnemonique}'")
        schema = NomenclatureSchema(many=True)
        return jsonify(schema.dump(nomenclatures))

def getNomenclature(nomenclature):
    logger.debug(f"📤 Sérialisation de la nomenclature ID={nomenclature.id_nomenclature}")
    schema = NomenclatureSchema(many=False)
    return jsonify(schema.dump(nomenclature))

def traitementThemeQuestions(nomenclatures, id_acteur):
    logger.info(f"🧠 Traitement des questions par thème pour acteur ID={id_acteur}")
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
                    reponse_acteur = { ... }  # identique à ton bloc
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

    logger.info(f"✅ Traitement terminé, {len(result)} thèmes renvoyés")
    return result
