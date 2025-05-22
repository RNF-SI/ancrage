from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp

@bp.route('/nomenclature/<id_nomenclature>', methods=['GET','PUT','DELETE'])
def nomenclatureMethods(id_nomenclature):
    nomenclature = Nomenclature.query.filter_by(id_nomenclature=id_nomenclature).first()
    
    print(nomenclature)
    if request.method == 'GET':

       return getNomenclature(nomenclature)
    
    
    elif request.method == 'PUT':
        data = request.get_json()
        nomenclature = changeValuesNomenclature(nomenclature,data)

        db.session.commit()
        return getNomenclature(nomenclature)

    elif request.method == 'DELETE':

        db.session.delete(nomenclature)
        db.session.commit()
        return {"success": "Suppression terminée"}
    
@bp.route('/nomenclature',methods=['POST'])
def postNomenclature():
    if request.method == 'POST': 
        
        data = request.get_json()
        print(data)
        nomenclature=Nomenclature()
        nomenclature = changeValuesNomenclature(nomenclature,data)
        db.session.add(nomenclature)
        db.session.commit()
        return getNomenclature(nomenclature)

@bp.route('/nomenclatures',methods=['GET'])
def getAllNomenclatures():
    if request.method == 'GET': 
        
        nomenclatures = Nomenclature.query.filter_by().all()
        schema = NomenclatureSchema(many=True)
        usersObj = schema.dump(nomenclatures)
        return jsonify(usersObj)
    
@bp.route('/nomenclatures/<mnemonique>',methods=['GET'])
def getAllNomenclaturesByUSer(mnemonique):
    if request.method == 'GET': 
        
        nomenclatures = Nomenclature.query.filter_by(mnemonique=mnemonique).all()
        schema = NomenclatureSchema(many=True)
        nomenclaturesObj = schema.dump(nomenclatures)
        return jsonify(nomenclaturesObj)
    
def changeValuesNomenclature(nomenclature,data):
    
    nomenclature.libelle = data['nom']
    nomenclature.mnemonique = data['position_x']
    
    return nomenclature

def getNomenclature(nomenclature):
    schema = NomenclatureSchema(many=False)
    nomenclatureObj = schema.dump(nomenclature)
    return jsonify(nomenclatureObj)


    