from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp,date_time
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
    """
    Enregistre ou met à jour les réponses d’un acteur.
    :param reponses_objets: Liste d’objets Reponse complets avec : acteur, question, valeur_reponse
    """
    if not reponses_objets:
        return

    # Récupération de l’acteur à partir du premier objet
    try:
        acteur_id = reponses_objets[0]['acteur']['id_acteur']
    except (KeyError, IndexError, TypeError):
        print("[ERREUR] Impossible d'extraire l'identifiant de l'acteur.")
        return

    # Liste des questions soumises dans cette mise à jour
    questions_ids_envoyees = set()

    for item in reponses_objets:
        try:
            question_id = item['question']['id_question']
            valeur_reponse_id = item['valeur_reponse']['id_nomenclature']
        except (KeyError, TypeError):
            continue  # Entrée mal formée

        if not valeur_reponse_id or valeur_reponse_id <= 0:
            continue  # Réponse vide ou invalide

        questions_ids_envoyees.add(question_id)

        # Cherche la réponse existante
        reponse = Reponse.query.filter_by(
            acteur_id=acteur_id,
            question_id=question_id
        ).first()

        if reponse:
            # Mise à jour
            reponse.valeur_reponse_id = valeur_reponse_id
        else:
            # Création
            nouvelle_reponse = Reponse(
                acteur_id=acteur_id,
                question_id=question_id,
                valeur_reponse_id=valeur_reponse_id
            )
            db.session.add(nouvelle_reponse)

    # Optionnel : suppression des anciennes réponses non envoyées
    # Tu peux supprimer ce bloc si tu ne veux pas supprimer
    reponses_existantes = Reponse.query.filter_by(acteur_id=acteur_id).all()
    for r in reponses_existantes:
        if r.question_id not in questions_ids_envoyees:
            db.session.delete(r)

    db.session.commit()