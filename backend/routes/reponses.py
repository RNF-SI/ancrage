from models.models import db
from flask import request
from models.models import *
from schemas.metier import *
from routes import bp,datetime, func,jsonify, timezone
from routes.mot_cle import getKeywordsByActor
from configs.logger_config import logger
from routes.functions import checkCCG, required_questions_query, normaliser_nom_mot_cle
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

    index = _indexer_mots_cles_diagnostic(acteur.diagnostic_id)

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

        mot_cle_bdd = _reutiliser_ou_creer_mot_cle(
            index, mc.get('id_mot_cle'), nom, diagnostic_id, categorie_id
        )

        mots_cles_bdd.append(mot_cle_bdd)

        if enfants:
            groupes_attendus.append((mot_cle_bdd, enfants))

    # Gestion des mots-clés enfants (groupés)
    for parent_mc, enfants in groupes_attendus:
        for enfant_data in enfants:
            nom_enfant = enfant_data.get('nom')
            diag_id_enfant = enfant_data.get('diagnostic', {}).get('id_diagnostic')

            if not nom_enfant or not diag_id_enfant:
                continue

            categorie_enfant = enfant_data.get('categorie')
            categorie_id_enfant = None
            if isinstance(categorie_enfant, dict):
                cat_id = categorie_enfant.get('id_nomenclature')
                if isinstance(cat_id, int):
                    categorie_id_enfant = cat_id

            _reutiliser_ou_creer_mot_cle(
                index,
                enfant_data.get('id_mot_cle'),
                nom_enfant,
                diag_id_enfant,
                categorie_id_enfant,
                groupe_id=parent_mc.id_mot_cle,
            )

    # Mise à jour ou création de la réponse
    reponse = Reponse.query.filter_by(acteur_id=acteur_id, question_id=question_id).first()
    ids_avant = {mc.id_mot_cle for mc in reponse.mots_cles} if reponse else set()

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

    db.session.flush()

    # Les mots-clés retirés de cette réponse ne doivent pas survivre en fantômes :
    # laissés en base, ils continuaient à être comptés dans l'AFOM.
    _supprimer_mots_cles_devenus_orphelins(
        acteur.diagnostic_id,
        ids_avant - {mc.id_mot_cle for mc in mots_cles_bdd},
    )

    logger.info(f"Réponse enregistrée pour l'acteur ID {acteur_id}. Vérification des dates entretien…")

    verifCompleteStatus(acteur_id)
    verifDatesEntretien(acteur.diagnostic.id_diagnostic)

    diagnostic_id = acteur.diagnostic_id
    mots_cles_repartis = getRepartitionMotsCles(diagnostic_id)

    record_afoms(diagnostic_id,mots_cles_repartis)


def _indexer_mots_cles_diagnostic(diagnostic_id):
    """Index des mots-clés existants du diagnostic, pour les réutiliser au lieu d'en dupliquer."""
    index = {"par_id": {}, "par_nom_categorie": {}, "par_nom": {}}
    if not diagnostic_id:
        return index

    mots_cles = (
        MotCle.query
        .filter(MotCle.diagnostic_id == diagnostic_id)
        .order_by(MotCle.id_mot_cle)
        .all()
    )
    for mc in mots_cles:
        nom_normalise = normaliser_nom_mot_cle(mc.nom)
        index["par_id"][mc.id_mot_cle] = mc
        index["par_nom_categorie"].setdefault((nom_normalise, mc.categorie_id), mc)
        index["par_nom"].setdefault(nom_normalise, mc)
    return index


def _reutiliser_ou_creer_mot_cle(index, id_envoye, nom, diagnostic_id, categorie_id, groupe_id=None):
    """Retourne le mot-clé du diagnostic correspondant, en le créant seulement s'il n'existe pas.

    Sans cette réutilisation, chaque enregistrement d'une réponse recréait une ligne
    par mot-clé : les lignes précédentes devenaient orphelines et gonflaient l'AFOM.
    """
    nom_normalise = normaliser_nom_mot_cle(nom)

    mot_cle = None
    if isinstance(id_envoye, int) and id_envoye > 0:
        mot_cle = index["par_id"].get(id_envoye)
    if mot_cle is None:
        mot_cle = index["par_nom_categorie"].get((nom_normalise, categorie_id))
    if mot_cle is None and categorie_id is None:
        mot_cle = index["par_nom"].get(nom_normalise)

    if mot_cle is None:
        mot_cle = MotCle(
            nom=nom,
            diagnostic_id=diagnostic_id,
            categorie_id=categorie_id,
            mots_cles_groupe_id=groupe_id,
            is_actif=True,
        )
        db.session.add(mot_cle)
        db.session.flush()
    else:
        mot_cle.nom = nom
        if categorie_id:
            mot_cle.categorie_id = categorie_id
        # On ne remet pas à None un regroupement décidé pendant l'analyse AFOM.
        if groupe_id is not None:
            mot_cle.mots_cles_groupe_id = groupe_id
        mot_cle.is_actif = True

    index["par_id"][mot_cle.id_mot_cle] = mot_cle
    index["par_nom_categorie"].setdefault((nom_normalise, mot_cle.categorie_id), mot_cle)
    index["par_nom"].setdefault(nom_normalise, mot_cle)
    return mot_cle


def _supprimer_mots_cles_devenus_orphelins(diagnostic_id, ids_candidats):
    """Supprime les mots-clés retirés d'une réponse et plus liés à aucune autre.

    Volontairement limité aux identifiants passés en paramètre : un mot-clé ajouté
    à la main dans l'écran d'analyse n'est lié à aucune réponse et doit être conservé.
    """
    if not diagnostic_id or not ids_candidats:
        return

    ids_lies = get_linked_mot_cle_ids_for_diagnostic(diagnostic_id)

    for id_mot_cle in ids_candidats:
        if id_mot_cle in ids_lies:
            continue
        mot_cle = db.session.get(MotCle, id_mot_cle)
        if not mot_cle or mot_cle.diagnostic_id != diagnostic_id:
            continue
        if mot_cle.mots_cles_issus:
            continue
        db.session.delete(mot_cle)


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

    acteurs_by_mc = get_acteurs_by_mot_cle(diagnostic_id)

    for item in mots_cles_repartis:
        mot_cle = item["mot_cle_obj"]
        if mot_cle.mots_cles_groupe_id is not None:
            continue

        enfants = mot_cle.mots_cles_issus or []
        # Acteurs distincts sur l'ensemble du groupe : citer le mot-clé parent
        # et l'un de ses enfants ne compte qu'une fois pour le même acteur.
        count = len(acteurs_du_groupe(mot_cle, enfants, acteurs_by_mc))

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


def get_acteurs_by_mot_cle(id_diagnostic):
    """Acteurs distincts ayant cité chaque mot-clé du diagnostic.

    On raisonne en acteurs et non en réponses : un acteur qui associe le même
    mot-clé à plusieurs questions de son entretien ne compte que pour une occurrence.
    """
    rows = (
        db.session.query(MotCle.id_mot_cle, Reponse.acteur_id)
        .join(reponse_mot_cle, reponse_mot_cle.c.mot_cle_id == MotCle.id_mot_cle)
        .join(Reponse, reponse_mot_cle.c.reponse_id == Reponse.id_reponse)
        .filter(MotCle.diagnostic_id == id_diagnostic)
        .distinct()
        .all()
    )

    acteurs_by_mc = {}
    for id_mot_cle, acteur_id in rows:
        if acteur_id is None:
            continue
        acteurs_by_mc.setdefault(id_mot_cle, set()).add(acteur_id)
    return acteurs_by_mc


def acteurs_du_groupe(mot_cle, enfants, acteurs_by_mc):
    """Acteurs distincts ayant cité un mot-clé racine ou l'un de ses mots-clés regroupés."""
    acteurs = set(acteurs_by_mc.get(mot_cle.id_mot_cle, ()))
    for enfant in enfants or ():
        acteurs |= acteurs_by_mc.get(enfant.id_mot_cle, set())
    return acteurs


def getRepartitionMotsCles(id_diagnostic):
    mots_cles = (
        db.session.query(MotCle)
        .options(selectinload(MotCle.mots_cles_issus))
        .filter(MotCle.diagnostic_id == id_diagnostic, MotCle.is_actif.is_(True))
        .all()
    )

    acteurs_by_mc = get_acteurs_by_mot_cle(id_diagnostic)

    data = []
    for mc in mots_cles:
        acteurs = acteurs_by_mc.get(mc.id_mot_cle, set())
        data.append({
            "mot_cle_obj": mc,
            "id": mc.id_mot_cle,
            "nom": mc.nom,
            "nombre": len(acteurs),
            "acteurs": acteurs,
            "categorie": mc.categorie,
            "mots_cles_issus": mc.mots_cles_issus
        })

    return data

def verifCompleteStatus(id_acteur):
    isCCG = checkCCG(id_acteur)
    count = required_questions_query(isCCG).count()

    nb_reponses = (
        required_questions_query(isCCG)
        .join(Reponse, (Reponse.question_id == Question.id_question) & (Reponse.acteur_id == id_acteur))
        .count()
    )

    nomenclatures = Nomenclature.query.filter_by(mnemonique="statut_entretien").all()

    statut_entretien_id = 0
    if nb_reponses >= count and count > 0:
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
        logger.error("Nombre de réponses incohérent pour l'acteur %s", id_acteur)
    
    acteur = Acteur.query.filter_by(id_acteur=id_acteur).first()

    if not acteur:
        logger.info(f" Aucun acteur trouvé avec l'ID {id_acteur}")
    else:
        acteur.statut_entretien_id = statut_entretien_id
        db.session.add(acteur)
        db.session.commit()