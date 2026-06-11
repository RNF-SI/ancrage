from models.models import db
from flask import request
from models.models import *
from schemas.metier import *
from routes import bp,datetime, func,jsonify, timezone
from routes.mot_cle import getKeywordsByActor
from configs.logger_config import logger
from routes.functions import checkCCG
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import selectinload, joinedload
from pypnusershub.decorators import check_auth


@bp.route('/reponse', methods=['POST'])
@check_auth(1)
def enregistrer_reponse_id():
    data = request.get_json()
    logger.info("Réception des données de réponses depuis objets")

    return enregistrer_reponse(data)

@bp.route('/reponse/objet', methods=['POST'])
@check_auth(1)    
def enregistrer_reponse_depuis_objet():
    data = request.get_json()
    logger.info("Réception des données de réponses depuis objets")

    enregistrer_reponse_acteur(data)
    acteur_id = data.get('acteur', {}).get('id_acteur')
    logger.info(f"Retour des nomenclatures pour l'acteur ID {acteur_id}")

    return getKeywordsByActor(acteur_id)

@check_auth(1)
def enregistrer_reponse(reponses_objets):
    if not reponses_objets:
        logger.warning("Aucune réponse fournie")
        return jsonify({"error": "Aucune réponse fournie"}), 400

    try:
        acteur_data = reponses_objets['acteur']
        acteur_id = acteur_data['id_acteur']
    except (KeyError, IndexError, TypeError):
        logger.error("Impossible d'extraire l'identifiant de l'acteur.")
        return jsonify({"error": "Identifiant acteur manquant"}), 400

    if not acteur_id or acteur_id <= 0:
        logger.error("Identifiant acteur invalide.")
        return jsonify({"error": "Identifiant acteur invalide"}), 400

    acteur = Acteur.query.get(acteur_id)
    if not acteur:
        logger.error(f"Acteur avec id {acteur_id} introuvable.")
        return jsonify({"error": f"Acteur avec id {acteur_id} introuvable"}), 404

    logger.info(f"Traitement des réponses pour l'acteur ID {acteur_id}")

    questions_ids_envoyees = set()

    try:
        question_id = reponses_objets['question']['id_question']
        valeur_reponse_id = reponses_objets['valeur_reponse']['id_nomenclature']
        commentaires = reponses_objets.get('commentaires', "")
    except (KeyError, TypeError):
        logger.warning("Réponse mal formée ignorée")
        return jsonify({"error": "Réponse mal formée"}), 400

    if not question_id or not valeur_reponse_id or valeur_reponse_id <= 0:
        logger.warning("Réponse incomplète ignorée (question ou valeur manquante)")
        return jsonify({"error": "Réponse incomplète"}), 400

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
    ).returning(Reponse)

    # Utiliser le résultat de returning() au lieu de refaire une requête
    result = db.session.execute(stmt).scalar_one()
    db.session.commit()
    
    verifCompleteStatus(acteur_id)
    verifDatesEntretien(acteur.diagnostic.id_diagnostic)
    
    schema = ReponseSchema(many=False)
    return jsonify(schema.dump(result))

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
            categorie_id=categorie_id,
            nombre=1
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
                mots_cles_groupe_id=parent_mc.id_mot_cle,
                nombre=1
            )
            db.session.add(nouvel_enfant)
            db.session.flush()
   
    # Mise à jour ou création de la réponse
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

    logger.info(f"Réponse enregistrée pour l'acteur ID {acteur_id}. Vérification des dates entretien…")
    
    verifCompleteStatus(acteur_id)
    verifDatesEntretien(acteur.diagnostic.id_diagnostic)

    diagnostic_id = acteur.diagnostic_id
    mots_cles_repartis = getRepartitionMotsCles(diagnostic_id)
  
    record_afoms(diagnostic_id,mots_cles_repartis)


def get_linked_mot_cle_ids_for_diagnostic(diagnostic_id):
    """Mots-clés encore liés à une réponse d'acteur du diagnostic (parents + enfants de groupe)."""
    directly_linked = (
        db.session.query(reponse_mot_cle.c.mot_cle_id)
        .join(Reponse, reponse_mot_cle.c.reponse_id == Reponse.id_reponse)
        .join(Acteur, Reponse.acteur_id == Acteur.id_acteur)
        .filter(Acteur.diagnostic_id == diagnostic_id)
    )
    linked_ids = {row[0] for row in directly_linked.all()}
    if linked_ids:
        children = (
            db.session.query(MotCle.id_mot_cle)
            .filter(MotCle.mots_cles_groupe_id.in_(linked_ids))
            .all()
        )
        linked_ids.update(row[0] for row in children)
    return linked_ids


def cleanup_orphan_mots_cles_for_diagnostic(diagnostic_id):
    """Supprime les mots-clés du diagnostic qui ne sont plus liés à aucune réponse."""
    if not diagnostic_id:
        return

    linked_ids = get_linked_mot_cle_ids_for_diagnostic(diagnostic_id)
    query = MotCle.query.filter(MotCle.diagnostic_id == diagnostic_id)
    if linked_ids:
        query = query.filter(~MotCle.id_mot_cle.in_(linked_ids))

    for mot_cle in query.all():
        db.session.delete(mot_cle)


def recalculate_afom_for_diagnostic(diagnostic_id):
    """Recalcule l'AFOM général à partir des mots-clés des acteurs restants."""
    if not diagnostic_id:
        return
    mots_cles_repartis = getRepartitionMotsCles(diagnostic_id)
    record_afoms(diagnostic_id, mots_cles_repartis)


def record_afoms(diagnostic_id, mots_cles_repartis):
    """Recalcule les AFOM à partir des entretiens, en respectant les groupes de mots-clés."""
    afom_ids_to_delete = (
        db.session.query(Afom.id_afom)
        .join(Afom.mot_cle)
        .filter(MotCle.diagnostic_id == diagnostic_id)
        .all()
    )

    afom_ids_to_delete = [id_tuple[0] for id_tuple in afom_ids_to_delete]
    if afom_ids_to_delete:
        db.session.query(Afom).filter(Afom.id_afom.in_(afom_ids_to_delete)).delete(synchronize_session=False)

    counts = {item["id"]: item["nombre"] for item in mots_cles_repartis}

    for item in mots_cles_repartis:
        mot_cle = item["mot_cle_obj"]
        if mot_cle.mots_cles_groupe_id is not None:
            continue

        count = counts.get(mot_cle.id_mot_cle, 0)
        enfants = mot_cle.mots_cles_issus or []
        for enfant in enfants:
            count += counts.get(enfant.id_mot_cle, 0)

        if enfants and count <= 0:
            count = mot_cle.nombre or sum((e.nombre or 0) for e in enfants)

        if count > 0:
            db.session.add(Afom(mot_cle_id=mot_cle.id_mot_cle, number=count))

    db.session.commit()
    logger.info(f"Réponse et AFOM enregistrés pour le diagnostic ID {diagnostic_id}")


def verifDatesEntretien(diagnostic_id):
    # Charger avec eager loading pour éviter les requêtes N+1
    diagnostic = (
        Diagnostic.query
        .options(selectinload(Diagnostic.acteurs).joinedload(Acteur.statut_entretien))
        .filter_by(id_diagnostic=diagnostic_id)
        .first()
    )
   
    statuts_termines = {'Réalisé', 'Annulé', 'Reporté', 'Rétracté'}
    listeTermines = [
        actor for actor in diagnostic.acteurs
        if actor.statut_entretien and actor.statut_entretien.libelle in statuts_termines
    ]

    logger.info(f"Nombre d'acteurs avec entretien terminé : {len(listeTermines)}")

    if len(listeTermines) == 1:
        diagnostic.date_debut = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
    if len(listeTermines) == len(diagnostic.acteurs):
        diagnostic.date_fin = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

    db.session.add(diagnostic)
    db.session.commit()


def getRepartitionMotsCles(id_diagnostic):
    mots_cles = (
        db.session.query(MotCle)
        .options(selectinload(MotCle.mots_cles_issus))
        .filter(MotCle.diagnostic_id == id_diagnostic, MotCle.is_actif.is_(True))
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
            "categorie": mc.categorie,
            "mots_cles_issus": mc.mots_cles_issus
        })

    return data

def verifCompleteStatus(id_acteur):
    nb_reponses = db.session.query(func.count(Reponse.id_reponse)).filter_by(acteur_id=id_acteur).scalar()
    isCCG = checkCCG(id_acteur)

    if isCCG:
        count = db.session.query(func.count(Question.id_question)).scalar()
    else:
        count = (
            db.session.query(func.count(Question.id_question))
            .join(Nomenclature, Question.theme_id == Nomenclature.id_nomenclature)
            .filter(Nomenclature.libelle != "CCG")
            .scalar()
        )
 
    nomenclatures = Nomenclature.query.filter_by(mnemonique="statut_entretien").all()
    
    statut_entretien_id=0
    if nb_reponses == count:
        for statut in nomenclatures:
            if statut.libelle == 'Réalisé':
                statut_entretien_id = statut.id_nomenclature
                break
    elif nb_reponses < count:
        for statut in nomenclatures:
            if statut.libelle == 'En cours':
                statut_entretien_id = statut.id_nomenclature
                break
    else:
        logger.error(f"Nombre réponses supérieur aux questions !!!")
    
    acteur = Acteur.query.filter_by(id_acteur=id_acteur).first()

    if not acteur:
        logger.info(f" Aucun acteur trouvé avec l'ID {id_acteur}")
    else:
        acteur.statut_entretien_id = statut_entretien_id
        db.session.add(acteur)
        db.session.commit()