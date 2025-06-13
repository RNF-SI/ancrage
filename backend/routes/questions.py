from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp, now, func
from routes.nomenclatures import getAllNomenclaturesByType
from routes.mot_cle import getKeywordsByActor
from routes.logger_config import logger
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import raiseload

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

    return getAllNomenclaturesByType("thème_question", acteur_id)

@bp.route('/reponse/objet', methods=['POST'])
def enregistrer_reponse_depuis_objet():
    data = request.get_json()
    logger.info("Réception des données de réponses depuis objets")

    enregistrer_reponse_acteur(data)
    acteur_id = data.get('acteur', {}).get('id_acteur')
    logger.info(f"Retour des nomenclatures pour l'acteur ID {acteur_id}")

    return getKeywordsByActor(acteur_id)

@bp.route('/question/<libelle>', methods=['GET'])
def get_question_without_relations(libelle):
    question = db.session.query(Question).options(
        raiseload(Question.reponses),
        raiseload(Question.theme),
        raiseload(Question.choixReponses),
        raiseload(Question.theme_question)
    ).filter_by(libelle=libelle).first()

    schema = QuestionSchema(many=False,exclude = ("reponses", "theme", "choixReponses", "theme_question"))

    questionObj = schema.dump(question)
    return jsonify(questionObj)  


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
        
        verifCompleteStatus(acteur_id)
        verifDatesEntretien(acteur.diagnostic.id_diagnostic)

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
    
    verifCompleteStatus(acteur_id)
    verifDatesEntretien(acteur.diagnostic.id_diagnostic)

    diagnostic_id = acteur.diagnostic_id
    mots_cles_repartis = getRepartitionMotsCles(diagnostic_id)

    record_afoms(diagnostic_id,mots_cles_repartis)


def record_afoms(diagnostic_id,mots_cles_repartis):
        # Suppression des AFOM précédents liés aux mots-clés de ce diagnostic
    afom_ids_to_delete = (
        db.session.query(Afom.id_afom)
        .join(Afom.mot_cle)
        .filter(MotCle.diagnostic_id == diagnostic_id)
        .all()
    )

    afom_ids_to_delete = [id_tuple[0] for id_tuple in afom_ids_to_delete]
    if afom_ids_to_delete:
        db.session.query(Afom).filter(Afom.id_afom.in_(afom_ids_to_delete)).delete(synchronize_session=False)

    # Ajout des nouveaux AFOM
    for item in mots_cles_repartis:
        mot_cle = item["mot_cle_obj"]
        count = item["nombre"]
        afom = Afom(
            mot_cle_id=mot_cle.id_mot_cle,
            number=count
        )
        db.session.add(afom)

    db.session.commit()
    logger.info(f"Réponse et AFOM enregistrés pour le diagnostic ID {diagnostic_id}")


def verifDatesEntretien(diagnostic_id):
    diagnostic = Diagnostic.query.filter_by(id_diagnostic=diagnostic_id).first()
   
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
            "categorie": mc.categorie,
            "mots_cles_issus": mc.mots_cles_issus
        })

    return data

def verifCompleteStatus(id_acteur):
    nb_reponses = db.session.query(func.count(Reponse.id_reponse)).filter_by(acteur_id=id_acteur).scalar()
    print(nb_reponses)
    nomenclatures = Nomenclature.query.filter_by(mnemonique="statut_entretien").all()
    
    statut_entretien_id=0
    if nb_reponses == 37:
        for statut in nomenclatures:
            if statut.libelle == 'Réalisé':
                statut_entretien_id = statut.id_nomenclature
                print('réalisé')
                break
    elif nb_reponses < 37:
        for statut in nomenclatures:
            if statut.libelle == 'En cours':
                statut_entretien_id = statut.id_nomenclature
                print('en cours')
                break
    
    acteur = Acteur.query.filter_by(id_acteur=id_acteur).first()

    if not acteur:
        logger.info(f"❌ Aucun acteur trouvé avec l'ID {id_acteur}")
    else:
        acteur.statut_entretien_id = statut_entretien_id
        db.session.add(acteur)
        db.session.commit()