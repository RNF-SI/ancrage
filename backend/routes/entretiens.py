from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.geo import *
from schemas.metier import *
from routes import bp,date_time

@bp.route('/entretien/<id_entretien>', methods=['GET','PUT','DELETE'])
def entretienMethods(id_entretien):
    entretien = Entretien.query.filter_by(id_entretien=id_entretien).first()
    
    print(entretien)
    if request.method == 'GET':

       return getEntretien(entretien)
    
    
    elif request.method == 'PUT':
        data = request.get_json()
        entretien = changeValuesEntretien(entretien,data)
        entretien.modified_at = date_time

        db.session.commit()
        return getEntretien(entretien)

    elif request.method == 'DELETE':

        db.session.delete(entretien)
        db.session.commit()
        return {"success": "Suppression terminée"}
    
@bp.route('/entretien',methods=['POST'])
def postEntretien():
    if request.method == 'POST': 
        
        data = request.get_json()
        print(data)
        entretien=Entretien()
        entretien = changeValuesEntretien(entretien,data)
        entretien.created_at = date_time
        entretien.created_by = data['created_by']
        db.session.add(entretien)
        db.session.commit()
        return getEntretien(entretien)

@bp.route('/entretiens',methods=['GET'])
def getAllEntretiens():
    if request.method == 'GET': 
        
        entretiens = Entretien.query.filter_by().all()
        schema = EntretienSchema(many=True)
        usersObj = schema.dump(entretiens)
        return jsonify(usersObj)
    
def changeValuesEntretien(entretien,data):
    
    entretien.date_entretien = data['nom']
    entretien.contexte = data['date_debut']
    entretien.reponses = data['reponses']
    return entretien

def getEntretien(entretien):
    schema = EntretienSchema(many=False)
    entretienObj = schema.dump(entretien)
    return jsonify(entretienObj)


    