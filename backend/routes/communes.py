from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp

@bp.route('/commune/<id_commune>', methods=['GET','PUT','DELETE'])
def communeMethods(id_commune):
    commune = Commune.query.filter_by(id_commune=id_commune).first()
    
    print(commune)
    if request.method == 'GET':

       return getCommune(commune)
    
    
    elif request.method == 'PUT':
        data = request.get_json()
        commune = changeValuesCommune(commune,data)

        db.session.commit()
        return getCommune(commune)

    elif request.method == 'DELETE':

        db.session.delete(commune)
        db.session.commit()
        return {"success": "Suppression terminée"}
    
@bp.route('/commune',methods=['POST'])
def postCommune():
    if request.method == 'POST': 
        
        data = request.get_json()
        print(data)
        commune=Commune()
        commune = changeValuesCommune(commune,data)
        db.session.add(commune)
        db.session.commit()
        return getCommune(commune)

@bp.route('/communes',methods=['GET'])
def getAllCommunes():
    if request.method == 'GET': 
        
        communes = Commune.query.filter_by().all()
        schema = CommuneSchema(many=True,exclude= ('geom','code_epci','insee_arr','insee_can','insee_reg','population','statut','departement','latitude','longitude'))
        usersObj = schema.dump(communes)
        return jsonify(usersObj)
    
def changeValuesCommune(commune,data):
    
    commune.libelle = data['nom']
    commune.mnemonique = data['position_x']
    
    return commune

def getCommune(commune):
    schema = CommuneSchema(many=False)
    communeObj = schema.dump(commune)
    return jsonify(communeObj)


    