import json

from models.models import db
from flask import request, jsonify
from sqlalchemy.orm import contains_eager, joinedload, selectinload
from models.models import *
from schemas.metier import (
    SiteSchema,
    enrich_site_dump,
)
from routes import bp, datetime, slugify, uuid, timezone
from configs.logger_config import logger
from pypnusershub.decorators import check_auth
from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import from_shape
from shapely.geometry import shape

@bp.route('/site/<int:id_site>/<string:slug>', methods=['GET','PUT','DELETE'])
@check_auth(1)
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
            site.modified_at = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
            site.modified_by = data['modified_by']

            db.session.commit()
            logger.info(f"💾 Modifications enregistrées pour le site {id_site}")
            return getSite(site)
        else:
            logger.warning("❌ Slug invalide pour mise à jour")
            return jsonify({'error': 'Slug invalide'}), 400
    else:
        if id_site and slug == site.slug:
            db.session.delete(site)
            db.session.commit()
            logger.info(f"🗑 Site {id_site} supprimé")
            return '', 204
        else:
            logger.warning("❌ Slug invalide pour suppression")
            return jsonify({'error': 'Slug invalide'}), 400

@bp.route('/site/', methods=['POST'])
@check_auth(1)
def postSite():
    
    if request.method == 'POST': 
        data = request.get_json()
        if not data:
            logger.warning("❌ Données JSON invalides")
            return jsonify({'error': 'Données JSON invalides'}), 400
        
        logger.info(f"📥 Création d'un nouveau site avec données : {data}")

        site = Site()
        site = changeValuesSite(site, data)
        myuuid = uuid.uuid4()
        site.slug = slugify(site.nom) + '-' + str(myuuid)
        site.created_at = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
        site.created_by = data['created_by']

        db.session.add(site)
        db.session.commit()
        logger.info(f"✅ Site créé avec ID {site.id_site} et slug {site.slug}")
        return getSite(site)

@bp.route('/sites', methods=['GET'])
@check_auth(1)
def getAllSites():
    if request.method == 'GET': 
        logger.info("📋 Récupération de tous les sites")
        sites = (
            Site.query
            .options(
                selectinload(Site.diagnostics),
                selectinload(Site.departements).selectinload(Departement.region),
                joinedload(Site.type)
            )
            .all()
        )
        usersObj = [_dump_site_for_api(site) for site in sites]
        logger.info(f"🔢 Nombre de sites retournés : {len(usersObj)}")
        return jsonify(usersObj)

@bp.route('/sites/<created_by>', methods=['GET'])
@check_auth(1)
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
        usersObj = [_dump_site_for_api(site) for site in sites]
        logger.info(f"🔢 Nombre de sites trouvés : {len(usersObj)}")
        return jsonify(usersObj)

def _update_site_geom_pt_from_positions(site, position_x, position_y):
    try:
        lng = float(position_x)
        lat = float(position_y)
    except (TypeError, ValueError):
        return
    if not (-180 <= lng <= 180 and -90 <= lat <= 90):
        return
    site.geom_pt = WKTElement(f'POINT({lng} {lat})', srid=4326)


def _update_site_geom_from_geojson(site, geojson_data):
    if not geojson_data:
        return

    if isinstance(geojson_data, str):
        geojson_data = json.loads(geojson_data)

    geom_type = geojson_data.get('type')
    if geom_type not in ('Polygon', 'MultiPolygon'):
        logger.warning(f"Type de géométrie non supporté pour un site : {geom_type}")
        return

    geom_shape = shape(geojson_data)
    site.geom = from_shape(geom_shape, srid=4326)

    centroid = geom_shape.centroid
    site.geom_pt = WKTElement(f'POINT({centroid.x} {centroid.y})', srid=4326)
    site.position_x = f'{centroid.x:.6f}'
    site.position_y = f'{centroid.y:.6f}'


def changeValuesSite(site, data):
    logger.debug(f"🔧 Mise à jour des champs du site avec les données : {data}")
    site.nom = data['nom']
    site.position_x = data['position_x']
    site.position_y = data['position_y']

    if data.get('geom'):
        _update_site_geom_from_geojson(site, data['geom'])
    else:
        _update_site_geom_pt_from_positions(site, data['position_x'], data['position_y'])

    site.type_id = data['type']['id_nomenclature']
    new_dept_ids = {d['id_departement'] for d in data['departements']}
    current_depts = {d.id_departement for d in site.departements}

    for dept in site.departements[:]:
        if dept.id_departement not in new_dept_ids:
            logger.info(f"🗑 Retrait du département {dept.id_departement} du site")
            site.departements.remove(dept)

    # Optimisation : charger tous les départements en une seule requête
    dept_ids_list = list(new_dept_ids - current_depts)
    if dept_ids_list:
        depts = Departement.query.filter(Departement.id_departement.in_(dept_ids_list)).all()
        for dept in depts:
            logger.info(f"➕ Ajout du département {dept.id_departement} au site")
            site.departements.append(dept)

    return site

def getSite(site):
    logger.info(f"📤 Sérialisation du site {site.id_site}")
    # Recharger avec eager loading pour éviter les requêtes N+1
    site = (
        db.session.query(Site)
        .options(
            selectinload(Site.diagnostics),
            selectinload(Site.departements).selectinload(Departement.region),
            joinedload(Site.type)
        )
        .filter_by(id_site=site.id_site)
        .first()
    )
    return jsonify(_dump_site_for_api(site))


def _dump_site_for_api(site):
    site_dict = SiteSchema().dump(site)
    return enrich_site_dump(site_dict, site)
