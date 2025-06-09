from models.models import db
from flask import request
from models.models import *
from schemas.metier import *
from routes import bp, now, func, logger
from routes.nomenclatures import getAllNomenclaturesByType

@bp.route('/reponses/objets', methods=['POST'])
def enregistrer_reponses_depuis_objets():
    data = request.get_json()
    logger.info("Réception des données de réponses depuis objets")

    if not isinstance(data, list):
        logger.warning("Format invalide : données non listées")
        return {"message": "Format invalide"}, 400

    enregistrer_reponses_acteur_depuis_objets(data)
    acteur_id = data[0].get('acteur', {}).get('id_acteur')
    logger.info(f"Retour des nomenclatures pour l'acteur ID {acteur_id}")

    return getAllNomenclaturesByType("thème", acteur_id)


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

    statut_data = acteur_data.get("statut_entretien")
    if statut_data:
        try:
            statut_id = statut_data.get("id_nomenclature")
            if statut_id and isinstance(statut_id, int):
                acteur.statut_entretien_id = statut_id
        except Exception as e:
            logger.error(f"Erreur lors de l'enregistrement du statut entretien : {e}")

    questions_ids_envoyees = set()

    for item in reponses_objets:
        try:
            question_id = item['question']['id_question']
            valeur_reponse_id = item['valeur_reponse']['id_nomenclature']
            commentaires = item.get('commentaires', "")
            mots_cles_front = item.get('mots_cles', [])
        except (KeyError, TypeError):
            logger.warning("Réponse mal formée ignorée")
            continue

        if not valeur_reponse_id or valeur_reponse_id <= 0:
            continue

        mots_cles_bdd = []
        groupes_attendus = []

        for mc in mots_cles_front:
            nom = mc['nom']
            diagnostic_id = mc['diagnostic']['id_diagnostic']
            categories_data = mc.get('categories', [])
            enfants = mc.get('mots_cles_issus', [])

            mc_existant = MotCle.query.filter_by(nom=nom, diagnostic_id=diagnostic_id).first()
            if not mc_existant:
                mc_existant = MotCle(nom=nom, diagnostic_id=diagnostic_id)
                db.session.add(mc_existant)
                db.session.flush()

            for cat in categories_data:
                cat_id = cat.get('id_nomenclature')
                if cat_id:
                    cat_obj = Nomenclature.query.get(cat_id)
                    if cat_obj and cat_obj not in mc_existant.categories:
                        mc_existant.categories.append(cat_obj)

            mots_cles_bdd.append(mc_existant)

            if enfants:
                groupes_attendus.append((mc_existant, enfants))

        for parent_mc, enfants in groupes_attendus:
            for enfant_data in enfants:
                nom_enfant = enfant_data.get('nom')
                diag_id_enfant = enfant_data.get('diagnostic', {}).get('id_diagnostic')

                if not nom_enfant or not diag_id_enfant:
                    continue

                enfant = MotCle.query.filter_by(nom=nom_enfant, diagnostic_id=diag_id_enfant).first()
                if not enfant:
                    enfant = MotCle(nom=nom_enfant, diagnostic_id=diag_id_enfant)
                    db.session.add(enfant)
                    db.session.flush()

                enfant.mots_cles_groupe_id = parent_mc.id_mot_cle

        questions_ids_envoyees.add(question_id)
        reponse = Reponse.query.filter_by(acteur_id=acteur_id, question_id=question_id).first()

        if reponse:
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

    reponses_existantes = Reponse.query.filter_by(acteur_id=acteur_id).all()
    for r in reponses_existantes:
        if r.question_id not in questions_ids_envoyees:
            db.session.delete(r)

    logger.info(f"Réponses enregistrées pour l'acteur ID {acteur_id}. Vérification des dates entretien…")
    verifDatesEntretien(acteur.diagnostic)

    diagnostic_id = acteur.diagnostic_id
    mot_cles_repartis = getRepartitionMotsCles(diagnostic_id)

    afom_ids_to_delete = (
        db.session.query(Afom.id_afom)
        .join(Afom.mot_cle)
        .filter(MotCle.diagnostic_id == diagnostic_id)
        .all()
    )

    afom_ids_to_delete = [id_tuple[0] for id_tuple in afom_ids_to_delete]

    if afom_ids_to_delete:
        db.session.query(Afom).filter(Afom.id_afom.in_(afom_ids_to_delete)).delete(synchronize_session=False)

    for item in mot_cles_repartis:
        mot_cle = item["mot_cle_obj"]
        count = item["nombre"]

        for cat in item['categories']:
            afom = Afom(
                mot_cle_id=mot_cle.id_mot_cle,
                number=count
            )
            db.session.add(afom)

    db.session.commit()
    logger.info(f"Réponses, mots-clés et AFOM enregistrés avec succès pour le diagnostic ID {diagnostic_id}")


def verifDatesEntretien(diagnostic):
    listeTermines = []
    for actor in diagnostic.acteurs:
        if actor.statut_entretien and actor.statut_entretien.libelle == 'Réalisé':
            listeTermines.append(actor)

    logger.info(f"Nombre d'acteurs avec entretien 'Réalisé' : {len(listeTermines)}")

    if len(listeTermines) == 1:
        diagnostic.date_debut = now
    if len(listeTermines) == len(diagnostic.acteurs):
        diagnostic.date_fin = now

    db.session.add(diagnostic)
    db.session.commit()


def getRepartitionMotsCles(id_diagnostic): 
    mots_cles = (
        db.session.query(MotCle)
        .filter(MotCle.diagnostic_id == id_diagnostic)
        .all()
    )

    counts = dict(
        db.session.query(
            MotCle.id_mot_cle,
            func.count(Reponse.id_reponse)
        )
        .join(reponse_mot_cle, reponse_mot_cle.c.mot_cle_id == MotCle.id_mot_cle)
        .join(Reponse, reponse_mot_cle.c.reponse_id == Reponse.id_reponse)
        .filter(MotCle.diagnostic_id == id_diagnostic)
        .group_by(MotCle.id_mot_cle)
        .all()
    )

    data = []
    for mc in mots_cles:
        data.append({
            "mot_cle_obj": mc, 
            "id": mc.id_mot_cle,
            "nom": mc.nom,
            "nombre": counts.get(mc.id_mot_cle, 0),
            "categories": mc.categories,
            "mots_cles_issus": mc.mots_cles_issus
        })

    return data
