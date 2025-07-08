from models.models import db
from flask import request, jsonify
from sqlalchemy.orm import contains_eager
from models.models import *
from schemas.metier import *
from routes import bp, now, slugify, uuid
from configs.logger_config import logger

@bp.route('/site/<id_site>/<slug>', methods=['GET','PUT','DELETE'])
def siteMethods(id_site, slug):
    logger.info(f"🔍 Requête {request.method} pour le site {id_site} avec slug '{slug}'")
    site = Site.query.filter_by(id_site=id_site).first()

    if not site:
        logger.warning(f"❌ Aucun site trouvé avec l'ID {id_site}")
        return jsonify({'error': 'Site non trouvé'}), 404

    if request.method == 'GET':
        if site.slug == slug:
            logger.info("✅ Slug valide - récupération des données du site")
            return getSite(site)
        else:
            logger.warning("❌ Slug invalide")
            return jsonify({'error': 'Slug invalide'}), 400

    elif request.method == 'PUT':
        if site.slug == slug:
            data = request.get_json()
            logger.info(f"✏ Mise à jour du site {id_site} avec données : {data}")
            site = changeValuesSite(site, data)
            site.modified_at = now
            site.modified_by = data['modified_by']

            db.session.commit()
            logger.info(f"💾 Modifications enregistrées pour le site {id_site}")
            return getSite(site)
        else:
            logger.warning("❌ Slug invalide pour mise à jour")
            return jsonify({'error': 'Slug invalide'}), 400

@bp.route('/site/', methods=['POST'])
def postSite():
    if request.method == 'POST': 
        data = request.get_json()
        logger.info(f"📥 Création d'un nouveau site avec données : {data}")

        site = Site()
        site = changeValuesSite(site, data)
        myuuid = uuid.uuid4()
        site.slug = slugify(site.nom) + '-' + str(myuuid)
        site.created_at = now
        site.created_by = data['created_by']

        db.session.add(site)
        db.session.commit()
        logger.info(f"✅ Site créé avec ID {site.id_site} et slug {site.slug}")
        return getSite(site)

@bp.route('/sites', methods=['GET'])
def getAllSites():
    if request.method == 'GET': 
        logger.info("📋 Récupération de tous les sites")
        sites = Site.query.filter_by().all()
        schema = SiteSchema(many=True)
        usersObj = schema.dump(sites)
        logger.info(f"🔢 Nombre de sites retournés : {len(usersObj)}")
        return jsonify(usersObj)

@bp.route('/sites/<created_by>', methods=['GET'])
def getAllSitesByUSer(created_by):
    if request.method == 'GET': 
        logger.info(f"📋 Récupération des sites créés par : {created_by}")
        sites = (
            db.session.query(Site)
            .join(Site.diagnostics)
            .filter(Diagnostic.created_by == created_by)
            .options(contains_eager(Site.diagnostics))
            .all()
        )
        schema = SiteSchema(many=True)
        usersObj = schema.dump(sites)
        logger.info(f"🔢 Nombre de sites trouvés : {len(usersObj)}")
        return jsonify(usersObj)

def changeValuesSite(site, data):
    logger.debug(f"🔧 Mise à jour des champs du site avec les données : {data}")
    site.nom = data['nom']
    site.position_x = data['position_x']
    site.position_y = data['position_y']
    site.type_id = data['type']['id_nomenclature']
    new_dept_ids = {d['id_departement'] for d in data['departements']}
    current_depts = {d.id_departement for d in site.departements}

    for dept in site.departements[:]:
        if dept.id_departement not in new_dept_ids:
            logger.info(f"🗑 Retrait du département {dept.id_departement} du site")
            site.departements.remove(dept)

    for dept_id in new_dept_ids - current_depts:
        logger.info(f"➕ Ajout du département {dept_id} au site")
        join = Departement.query.filter_by(id_departement=dept_id).first()
        site.departements.append(join)

    return site

def getSite(site):
    logger.info(f"📤 Sérialisation du site {site.id_site}")
    schema = SiteSchema(many=False)
    siteObj = schema.dump(site)
    return jsonify(siteObj)
