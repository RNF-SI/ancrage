from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp,now,joinedload
from routes.acteurs import getActeur
    
@bp.route('/reponses/objets', methods=['POST'])
def enregistrer_reponses_depuis_objets():
    data = request.get_json()

    if not isinstance(data, list):
        return {"message": "Format invalide"}, 400

    enregistrer_reponses_acteur_depuis_objets(data)
    acteur_id = data[0].get('acteur', {}).get('id_acteur')
    acteur = Acteur.query.filter_by(id_acteur=acteur_id).first()
    
    return getActeur(acteur)

def enregistrer_reponses_acteur_depuis_objets(reponses_objets): 
    if not reponses_objets:
        return

    try:
        acteur_data = reponses_objets[0]['acteur']
        acteur_id = acteur_data['id_acteur']
    except (KeyError, IndexError, TypeError):
        print("[ERREUR] Impossible d'extraire l'identifiant de l'acteur.")
        return

    acteur = Acteur.query.get(acteur_id)
    if not acteur:
        print(f"[ERREUR] Acteur avec id {acteur_id} introuvable.")
        return

    statut_data = acteur_data.get("statut_entretien")
    if statut_data:
        try:
            statut_id = statut_data.get("id_nomenclature")
            if statut_id and isinstance(statut_id, int):
                acteur.statut_entretien_id = statut_id
        except Exception as e:
            print(f"[ERREUR statut_entretien] {e}")

    questions_ids_envoyees = set()

    for item in reponses_objets:
        try:
            question_id = item['question']['id_question']
            valeur_reponse_id = item['valeur_reponse']['id_nomenclature']
            commentaires = item.get('commentaires', "")
            mots_cles_front = item.get('mots_cles', [])
        except (KeyError, TypeError):
            continue

        if not valeur_reponse_id or valeur_reponse_id <= 0:
            continue

        mots_cles_bdd = []
        groupes_attendus = []

        # Étape 1 : Création ou MAJ de tous les mots-clés
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

            # On prépare l'association avec les enfants (s'ils existent)
            if enfants:
                groupes_attendus.append((mc_existant, enfants))

        # Étape 2 : Pour chaque groupe, on crée ses enfants s’ils n'existent pas et on les relie
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

        # Étape 3 : Réponse
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

    # Nettoyage : suppression des réponses non envoyées
    reponses_existantes = Reponse.query.filter_by(acteur_id=acteur_id).all()
    for r in reponses_existantes:
        if r.question_id not in questions_ids_envoyees:
            db.session.delete(r)

    db.session.commit()
    verifDatesEntretien(acteur.diagnostic)

def verifDatesEntretien(diagnostic):
   
    listeTermines = []
    for actor in diagnostic.acteurs:
       
        if actor.statut_entretien:
            if actor.statut_entretien.libelle == 'Réalisé':
                listeTermines.append(actor)
    print(len(listeTermines))
    if len(listeTermines) == 1:
        diagnostic.date_debut = now
    if len(listeTermines) == len(diagnostic.acteurs):
        diagnostic.date_fin = now
    db.session.add(diagnostic)
    db.session.commit()

