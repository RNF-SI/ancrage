from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp,now
from datetime import datetime,timezone


@bp.route('/acteur/<id_acteur>', methods=['GET','PUT','DELETE'])
def acteurMethods(id_acteur):
    acteur = Acteur.query.filter_by(id_acteur=id_acteur).first()
    
    print(acteur)
    if request.method == 'GET':

       return getActeur(acteur)
    
    
    elif request.method == 'PUT':
        data = request.get_json()
        acteur = changeValuesActeur(acteur,data)
        acteur.modified_at = now
        acteur.modified_by = data['modified_by']

        db.session.commit()
        return getActeur(acteur)

    elif request.method == 'DELETE':

        db.session.delete(acteur)
        db.session.commit()
        return {"success": "Suppression terminée"}
    
@bp.route('/acteur/',methods=['POST'])
def postActeur():
    if request.method == 'POST': 
        
        data = request.get_json()
    
        acteur=Acteur()
        acteur = changeValuesActeur(acteur,data)

        acteur.created_at = now
        acteur.created_by = data['created_by']
        print(f"""✔ Données acteur mises à jour :
        - Nom        : {acteur.nom}
        - Prénom     : {acteur.prenom}
        - Fonction   : {acteur.fonction}
        - Téléphone  : {acteur.telephone}
        - Email      : {acteur.mail}
        - Commune ID : {acteur.commune_id}
        - Structure  : {acteur.structure}
        - Profil ID  : {acteur.profil_cognitif_id}
        - is_acteur  : {acteur.is_acteur_economique}
        """)
        acteur.created_at = now
        acteur.created_by = data.get('created_by', 'unknown')
        db.session.add(acteur)
        db.session.commit()
        return getActeur(acteur)
    
@bp.route('/acteur/<id_acteur>/<id_statut>',methods=['PUT'])
def changeStateInterview(id_acteur,id_statut):
    if request.method == 'PUT': 
        data = request.get_json()
        acteur = Acteur.query.filter_by(id_acteur=id_acteur).first()
        acteur.statut_entretien_id = id_statut
        acteur.modified_at = now
        acteur.modified_by = data['modified_by']
        db.session.add(acteur)
        db.session.commit()
        return getActeur(acteur)

@bp.route('/acteurs',methods=['GET'])
def getAllActeurs():
    if request.method == 'GET': 
        
        acteurs = Acteur.query.filter_by().all()
        schema = ActeurSchema(many=True)
        usersObj = schema.dump(acteurs)
        return jsonify(usersObj)
    
@bp.route('/acteurs/<created_by>',methods=['GET'])
def getAllActeursByUSer(created_by):
    if request.method == 'GET': 
        
        acteurs = Acteur.query.filter_by(created_by=created_by).all()
        schema = ActeurSchema(many=True)
        usersObj = schema.dump(acteurs)
        return jsonify(usersObj)
    
def changeValuesActeur(acteur,data):
    
    acteur.nom = data['nom']
    acteur.prenom = data['prenom']
    acteur.fonction = data['fonction']
    acteur.telephone = data['telephone']
    acteur.mail = data['mail']
    acteur.commune_id = data['commune']['id_commune']
    acteur.structure = data['structure'] 
    acteur.profil_cognitif_id = data['profil']['id_nomenclature']
    acteur.is_acteur_economique = data['is_acteur_economique']
    new_cat_ids = {c['id_nomenclature'] for c in data['categories']}
    current_cats = {c.id_nomenclature for c in acteur.categories}

    # Supprimer les départements en trop
    for cat in acteur.categories[:]:
        if cat.id_nomenclature not in new_cat_ids:
            acteur.categories.remove(cat)

    # Ajouter les nouveaux départements
    for cat_id in new_cat_ids - current_cats:
        join = Nomenclature.query.filter_by(id_nomenclature=cat_id).first()
        acteur.categories.append(join)

    return acteur

def getActeur(acteur):
    schema = ActeurSchema(many=False)
    acteurObj = schema.dump(acteur)
    return jsonify(acteurObj)


    