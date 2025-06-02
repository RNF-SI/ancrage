from models.models import db
from flask import request, jsonify
from sqlalchemy.orm import contains_eager
from models.models import *
from schemas.metier import *
from routes import bp,now,slugify,uuid


@bp.route('/site/<id_site>/<slug>', methods=['GET','PUT','DELETE'])
def siteMethods(id_site,slug):
    site = Site.query.filter_by(id_site=id_site).first()
    
    if request.method == 'GET':
        if site.slug == slug:
            return getSite(site)
    
    
    elif request.method == 'PUT':
        if site.slug == slug:
            data = request.get_json()
            site = changeValuesSite(site,data)
            site.modified_at = now
            site.modified_by = data['modified_by']

            db.session.commit()
            return getSite(site)
    
@bp.route('/site/',methods=['POST'])
def postSite():
    if request.method == 'POST': 
        
        data = request.get_json()
    
        site=Site()
        site = changeValuesSite(site,data)
        myuuid = uuid.uuid4()
        site.slug = slugify(site.nom) + '-' + str(myuuid)
        site.created_at = now
        site.created_by = data['created_by']
        db.session.add(site)
        db.session.commit()
        return getSite(site)

@bp.route('/sites',methods=['GET'])
def getAllSites():
    if request.method == 'GET': 
        
        sites = Site.query.filter_by().all()
        schema = SiteSchema(many=True)
        usersObj = schema.dump(sites)
        return jsonify(usersObj)
    
@bp.route('/sites/<created_by>',methods=['GET'])
def getAllSitesByUSer(created_by):
    if request.method == 'GET': 
        
        sites = (
            db.session.query(Site)
            .join(Site.diagnostics)
            .filter(Diagnostic.created_by == created_by)
            .options(contains_eager(Site.diagnostics))
            .all()
        )
        schema = SiteSchema(many=True)
        usersObj = schema.dump(sites)
        return jsonify(usersObj)
    
def changeValuesSite(site,data):
    
    site.nom = data['nom']
    site.position_x = data['position_x']
    site.position_y = data['position_y']
    site.type_id = data['type']['id_nomenclature']
    new_dept_ids = {d['id_departement'] for d in data['departements']}
    current_depts = {d.id_departement for d in site.departements}

    # Supprimer les départements en trop
    for dept in site.departements[:]:
        if dept.id_departement not in new_dept_ids:
            site.departements.remove(dept)

    # Ajouter les nouveaux départements
    for dept_id in new_dept_ids - current_depts:
        join = Departement.query.filter_by(id_departement=dept_id).first()
        site.departements.append(join)
        print(f"Site: {site.nom}, Type ID: {site.type_id}, Departements: {[d.nom_dep for d in site.departements]}")
    return site

def getSite(site):
    schema = SiteSchema(many=False)
    siteObj = schema.dump(site)
    return jsonify(siteObj)


    