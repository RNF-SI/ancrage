from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp,date_time

@bp.route('/region/<id_region>', methods=['GET','PUT','DELETE'])
def regionMethods(id_region):
    region = Region.query.filter_by(id_region=id_region).first()
    
    print(region)
    if request.method == 'GET':

       return getRegion(region)
    
    
    elif request.method == 'PUT':
        data = request.get_json()
        region = changeValuesRegion(region,data)

        db.session.commit()
        return getRegion(region)

    elif request.method == 'DELETE':

        db.session.delete(region)
        db.session.commit()
        return {"success": "Suppression terminée"}
    
@bp.route('/region',methods=['POST'])
def postRegion():
    if request.method == 'POST': 
        
        data = request.get_json()
        print(data)
        region=Region()
        region = changeValuesRegion(region,data)
        db.session.add(region)
        db.session.commit()
        return getRegion(region)

@bp.route('/regions',methods=['GET'])
def getAllRegions():
    if request.method == 'GET': 
        
        regions = Region.query.filter_by().all()
        schema = RegionSchema(many=True)
        usersObj = schema.dump(regions)
        return jsonify(usersObj)
    
@bp.route('/regions/<mnemonique>',methods=['GET'])
def getAllRegionsByUSer(mnemonique):
    if request.method == 'GET': 
        
        regions = Region.query.filter_by(mnemonique=mnemonique).all()
        schema = RegionSchema(many=True)
        regionsObj = schema.dump(regions)
        return jsonify(regionsObj)
    
def changeValuesRegion(region,data):
    
    region.libelle = data['nom']
    region.mnemonique = data['position_x']
    
    return region

def getRegion(region):
    schema = RegionSchema(many=False)
    regionObj = schema.dump(region)
    return jsonify(regionObj)


    