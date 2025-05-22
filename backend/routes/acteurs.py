from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp,now

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
    acteur.position_x = data['position_x']
    acteur.position_y = data['position_y']
    acteur.type_id = data['type']['id_nomenclature']
    new_dept_ids = {d['id_departement'] for d in data['departements']}
    current_depts = {d.id_departement for d in acteur.departements}

    # Supprimer les départements en trop
    for dept in acteur.departements[:]:
        if dept.id_departement not in new_dept_ids:
            acteur.departements.remove(dept)

    # Ajouter les nouveaux départements
    for dept_id in new_dept_ids - current_depts:
        join = Departement.query.filter_by(id_departement=dept_id).first()
        acteur.departements.append(join)
        print(f"Acteur: {acteur.nom}, Type ID: {acteur.type_id}, Departements: {[d.nom_dep for d in acteur.departements]}")
    return acteur

def getActeur(acteur):
    schema = ActeurSchema(many=False)
    acteurObj = schema.dump(acteur)
    return jsonify(acteurObj)


    