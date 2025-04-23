from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp,date_time

@bp.route('/departement/<id_departement>', methods=['GET','PUT','DELETE'])
def departementMethods(id_departement):
    departement = Departement.query.filter_by(id_departement=id_departement).first()
    
    print(departement)
    if request.method == 'GET':

       return getDepartement(departement)
    
    
    elif request.method == 'PUT':
        data = request.get_json()
        departement = changeValuesDepartement(departement,data)

        db.session.commit()
        return getDepartement(departement)

    elif request.method == 'DELETE':

        db.session.delete(departement)
        db.session.commit()
        return {"success": "Suppression terminée"}
    
@bp.route('/departement',methods=['POST'])
def postDepartement():
    if request.method == 'POST': 
        
        data = request.get_json()
        print(data)
        departement=Departement()
        departement = changeValuesDepartement(departement,data)
        db.session.add(departement)
        db.session.commit()
        return getDepartement(departement)

@bp.route('/departements',methods=['GET'])
def getAllDepartements():
    if request.method == 'GET': 
        
        departements = Departement.query.filter_by().all()
        schema = DepartementSchema(many=True)
        usersObj = schema.dump(departements)
        return jsonify(usersObj)
    
@bp.route('/departements/<mnemonique>',methods=['GET'])
def getAllDepartementsByUSer(mnemonique):
    if request.method == 'GET': 
        
        departements = Departement.query.filter_by(mnemonique=mnemonique).all()
        schema = DepartementSchema(many=True)
        departementsObj = schema.dump(departements)
        return jsonify(departementsObj)
    
def changeValuesDepartement(departement,data):
    
    departement.libelle = data['nom']
    departement.mnemonique = data['position_x']
    
    return departement

def getDepartement(departement):
    schema = DepartementSchema(many=False)
    departementObj = schema.dump(departement)
    return jsonify(departementObj)


    