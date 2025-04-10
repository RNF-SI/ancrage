from app import db
from flask import request, Blueprint, jsonify
from models.models import *
from schemas.geo import *
from schemas.metier import *
from datetime import datetime

bp_sites = Blueprint('sites', __name__)
now = datetime.now()
date_time = now.strftime("%m/%d/%Y, %H:%M:%S")

@bp_sites.route('/site/<id_site>', methods=['GET','PUT','DELETE'])
def siteMethods(id_site):
    site = Site.query.filter_by(id_site=id_site).first()
    
    print(site)
    if request.method == 'GET':

       return getSite(site)
    
    
    elif request.method == 'PUT':
        data = request.get_json()
        site = changeValuesSite(site,data)
        site.modified_at = date_time
        site.modified_by = data['modified_by']

        db.session.commit()
        return getSite(site)

    elif request.method == 'DELETE':

        db.session.delete(site)
        db.session.commit()
        return {"success": "Suppression terminée"}
    
@bp_sites.route('/site',methods=['POST'])
def postSite():
    if request.method == 'POST': 
        
        data = request.get_json()
        print(data)
        site=Site()
        site = changeValuesSite(site,data)
        site.created_at = date_time
        site.created_by = data['created_by']
        db.session.add(site)
        db.session.commit()
        return getSite(site)

@bp_sites.route('/sites',methods=['GET'])
def getAllSites():
    if request.method == 'GET': 
        
        sites = Site.query.filter_by().all()
        schema = SiteSchema(many=True)
        usersObj = schema.dump(sites)
        return jsonify(usersObj)
    
def changeValuesSite(site,data):
    
    site.nom = data['nom']
    site.position_x = data['position_x']
    site.position_y = data['position_y']
    return site

def getSite(site):
    schema = SiteSchema(many=False)
    siteObj = schema.dump(site)
    return jsonify(siteObj)


    