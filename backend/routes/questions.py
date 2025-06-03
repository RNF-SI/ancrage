from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp,now
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

    # 🔄 Mise à jour du statut_entretien
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
            mots_cles = item.get('mots_cles', [])
        except (KeyError, TypeError):
            continue

        if not valeur_reponse_id or valeur_reponse_id <= 0:
            continue

        mots_cles_bdd = []
        for mc in mots_cles:
            nom = mc['nom']
            diagnostic_id = mc['diagnostic']['id_diagnostic']
            categories_data = mc.get('categories', [])  # ✅ Liste de catégories

            # 🔍 Recherche du mot-clé existant
            mc_existant = MotCle.query.filter_by(
                nom=nom,
                diagnostic_id=diagnostic_id
            ).first()

            if mc_existant:
                # 🔁 Ajout des catégories si elles ne sont pas déjà liées
                for cat_data in categories_data:
                    categorie_id = cat_data['id_nomenclature']
                    cat = Nomenclature.query.get(categorie_id)
                    if cat and cat not in mc_existant.categories:
                        mc_existant.categories.append(cat)
                mots_cles_bdd.append(mc_existant)
            else:
                # ➕ Création du nouveau mot-clé
                mc_nouveau = MotCle(
                    nom=nom,
                    diagnostic_id=diagnostic_id
                )
               
                db.session.add(mc_nouveau)
                db.session.flush()
                for cat_data in categories_data:
                    categorie_id = cat_data['id_nomenclature']
                    print(categorie_id)
                    cat = Nomenclature.query.get(categorie_id)
                    if cat and categorie_id>0:
                        mc_nouveau.categories.append(cat)
                mots_cles_bdd.append(mc_nouveau)

        questions_ids_envoyees.add(question_id)

        reponse = Reponse.query.filter_by(
            acteur_id=acteur_id,
            question_id=question_id
        ).first()

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

    # 🔥 Supprime les anciennes réponses non renvoyées
    reponses_existantes = Reponse.query.filter_by(acteur_id=acteur_id).all()
    for r in reponses_existantes:
        if r.question_id not in questions_ids_envoyees:
            db.session.delete(r)

    db.session.commit()

    # ✅ Post-traitement
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

