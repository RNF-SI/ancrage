from models.models import db
from flask import request
from models.models import *
from schemas.metier import *
from routes import bp, now, func
from routes.nomenclatures import getAllNomenclaturesByType
from routes.mot_cle import getKeywordsByActor
from routes.logger_config import logger
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError
from backend.services.reponse_service import ReponseService

# Instancier le service (mais on garde la logique complexe intacte)
reponse_service = ReponseService()


@bp.route('/reponses/objets', methods=['POST'])
def enregistrer_reponses_depuis_objets():
    """Enregistre des réponses en masse - AMÉLIORATION : validation JSON"""
    from backend.error_handlers import validate_json_request
    
    try:
        data = validate_json_request(request)
        logger.info("Réception des données de réponses depuis objets")

        if not isinstance(data, list):
            logger.warning("Format invalide : données non listées")
            return {"message": "Format invalide"}, 400
    except Exception as e:
        reponse_service.logger.error(f"Erreur validation JSON: {str(e)}")
        return {"message": "Données JSON invalides"}, 400

    enregistrer_reponses_acteur_depuis_objets(data)
    acteur_id = data[0].get('acteur', {}).get('id_acteur')
    logger.info(f"Retour des nomenclatures pour l'acteur ID {acteur_id}")

    return getAllNomenclaturesByType("thème_question", acteur_id)

@bp.route('/reponse/objet', methods=['POST'])
def enregistrer_reponse_depuis_objet():
    """Enregistre une réponse unique - AMÉLIORATION : validation JSON"""
    from backend.error_handlers import validate_json_request
    
    try:
        data = validate_json_request(request)
        logger.info("Réception des données de réponse depuis objet")
    except Exception as e:
        reponse_service.logger.error(f"Erreur validation JSON: {str(e)}")
        return {"message": "Données JSON invalides"}, 400

    enregistrer_reponse_acteur(data)
    acteur_id = data.get('acteur', {}).get('id_acteur')
    logger.info(f"Retour des nomenclatures pour l'acteur ID {acteur_id}")

    return getKeywordsByActor(acteur_id)

def enregistrer_reponses_acteur_depuis_objets(reponses_objets):
    if not reponses_objets:
        logger.warning("Aucune réponse fournie")
        return

    try:
        acteur_data = reponses_objets[0]['acteur']
        acteur_id = acteur_data['id_acteur']
    except (KeyError, IndexError, TypeError):
        logger.error("Impossible d'extraire l'identifiant de l'acteur.")
        return

    acteur = Acteur.query.get(acteur_id)
    if not acteur:
        logger.error(f"Acteur avec id {acteur_id} introuvable.")
        return

    logger.info(f"Traitement des réponses pour l'acteur ID {acteur_id}")

    questions_ids_envoyees = set()

    try:
        for item in reponses_objets:
            try:
                question_id = item['question']['id_question']
                valeur_reponse_id = item['valeur_reponse']['id_nomenclature']
                commentaires = item.get('commentaires', "")
            except (KeyError, TypeError):
                logger.warning("Réponse mal formée ignorée")
                continue

            if not valeur_reponse_id or valeur_reponse_id <= 0:
                continue

            questions_ids_envoyees.add(question_id)

            stmt = insert(Reponse).values(
                acteur_id=acteur_id,
                question_id=question_id,
                valeur_reponse_id=valeur_reponse_id,
                commentaires=commentaires
            ).on_conflict_do_update(
                index_elements=['acteur_id', 'question_id'],
                set_={
                    'valeur_reponse_id': valeur_reponse_id,
                    'commentaires': commentaires
                }
            )
            db.session.execute(stmt)

        # Suppression des réponses non présentes dans l'objet reçu
        reponses_existantes = Reponse.query.filter_by(acteur_id=acteur_id).all()
        for r in reponses_existantes:
            if r.question_id not in questions_ids_envoyees:
                db.session.delete(r)

        db.session.commit()
        logger.info(f"Réponses enregistrées pour l'acteur ID {acteur_id}. Vérification des dates entretien…")
        
        reponse_service.verif_complete_status(acteur_id)
        reponse_service.verif_dates_entretien(acteur.diagnostic.id_diagnostic)

    except SQLAlchemyError as e:
        db.session.rollback()
        logger.error(f"Erreur SQLAlchemy pendant l'enregistrement des réponses : {e}")

def enregistrer_reponse_acteur(reponse_objet):
    try:
        acteur_data = reponse_objet['acteur']
        acteur_id = acteur_data['id_acteur']
    except (KeyError, TypeError):
        logger.error("Impossible d'extraire l'identifiant de l'acteur.")
        return

    acteur = Acteur.query.get(acteur_id)
    if not acteur:
        logger.error(f"Acteur avec id {acteur_id} introuvable.")
        return

    logger.info(f"Traitement de la réponse pour l'acteur ID {acteur_id}")


    try:
        question_id = reponse_objet['question']['id_question']
        valeur_reponse_id = reponse_objet['valeur_reponse']['id_nomenclature']
        commentaires = reponse_objet.get('commentaires', "")
        mots_cles_front = reponse_objet.get('mots_cles', [])
    except (KeyError, TypeError):
        logger.warning("Réponse mal formée ignorée")
        return

    if not valeur_reponse_id or valeur_reponse_id <= 0:
        return

    mots_cles_bdd = []
    groupes_attendus = []

    for mc in mots_cles_front:
        nom = mc['nom']
        diagnostic_id = mc['diagnostic']['id_diagnostic']
        categorie_data = mc.get('categorie', {})
        enfants = mc.get('mots_cles_issus', [])

        categorie_id = None
        if isinstance(categorie_data, dict):
            cat_id = categorie_data.get('id_nomenclature')
            if isinstance(cat_id, int):
                categorie_id = cat_id
        
        nouveau_mc = MotCle(
            nom=nom,
            diagnostic_id=diagnostic_id,
            categorie_id=categorie_id
        )
        db.session.add(nouveau_mc)
        db.session.flush()

        mots_cles_bdd.append(nouveau_mc)

        if enfants:
            groupes_attendus.append((nouveau_mc, enfants))

    # Gestion des mots-clés enfants (groupés)
    for parent_mc, enfants in groupes_attendus:
        for enfant_data in enfants:
            nom_enfant = enfant_data.get('nom')
            diag_id_enfant = enfant_data.get('diagnostic', {}).get('id_diagnostic')

            if not nom_enfant or not diag_id_enfant:
                continue

            nouvel_enfant = MotCle(
                nom=nom_enfant,
                diagnostic_id=diag_id_enfant,
                mots_cles_groupe_id=parent_mc.id_mot_cle
            )
            db.session.add(nouvel_enfant)
            db.session.flush()

    # Mise à jour ou création de la réponse
    reponse = Reponse.query.filter_by(acteur_id=acteur_id, question_id=question_id).first()
    if reponse:
        print(f"Réponse {reponse.id_reponse}")
        reponse.valeur_reponse_id = valeur_reponse_id
        reponse.commentaires = commentaires
        reponse.mots_cles = mots_cles_bdd
    else:
        nouvelle_reponse = Reponse(
            acteur_id=acteur_id,
            question_id=question_id,
            valeur_reponse_id=valeur_reponse_id,
            commentaires=commentaires,
            mots_cles=mots_cles_bdd
        )
        db.session.add(nouvelle_reponse)

    logger.info(f"Réponse enregistrée pour l'acteur ID {acteur_id}. Vérification des dates entretien…")
    
    reponse_service.verif_complete_status(acteur_id)
    reponse_service.verif_dates_entretien(acteur.diagnostic.id_diagnostic)

    diagnostic_id = acteur.diagnostic_id
    mots_cles_repartis = reponse_service.get_repartition_mots_cles(diagnostic_id)

    reponse_service.record_afoms(diagnostic_id, mots_cles_repartis)


# Toutes les fonctions helpers ont été déplacées vers ReponseService