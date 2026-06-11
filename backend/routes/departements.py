import json

from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import from_shape
from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp
from configs.logger_config import logger
from pypnusershub.decorators import check_auth
from shapely.geometry import shape
from sqlalchemy import func
from sqlalchemy.orm import selectinload

@bp.route('/departement/<id_departement>', methods=['GET', 'PUT', 'DELETE'])
@check_auth(1)
def departementMethods(id_departement):
    logger.info(f"📍 Requête {request.method} sur le département ID={id_departement}")
    departement = Departement.query.filter_by(id_departement=id_departement).first()

    if not departement:
        logger.warning(f"❌ Département ID={id_departement} non trouvé")
        return jsonify({'error': 'Département non trouvé'}), 404

    if request.method == 'GET':
        logger.info(f"📤 Récupération des infos du département ID={id_departement}")
        return getDepartement(departement)

    elif request.method == 'PUT':
        data = request.get_json()
        logger.info(f"✏ Mise à jour du département ID={id_departement} avec données : {data}")
        departement = changeValuesDepartement(departement, data)
        db.session.commit()
        logger.info(f"✅ Département ID={id_departement} mis à jour")
        return getDepartement(departement)

    elif request.method == 'DELETE':
        logger.info(f"🗑 Suppression du département ID={id_departement}")
        db.session.delete(departement)
        db.session.commit()
        logger.info(f"✅ Département ID={id_departement} supprimé")
        return {"success": "Suppression terminée"}

@bp.route('/departement', methods=['POST'])
@check_auth(1)
def postDepartement():
    if request.method == 'POST':
        data = request.get_json()
        logger.info(f"📥 Création d'un nouveau département avec données : {data}")
        departement = Departement()
        departement = changeValuesDepartement(departement, data)
        db.session.add(departement)
        db.session.commit()
        logger.info(f"✅ Nouveau département créé avec ID={departement.id_departement}")
        return getDepartement(departement)

def _site_geometry_from_request(data):
    """Construit une géométrie PostGIS à partir de geom, geom_pt ou position_x/y."""
    if not data:
        return None

    geom_data = data.get('geom')
    if geom_data:
        if isinstance(geom_data, str):
            geom_data = json.loads(geom_data)
        geom_type = geom_data.get('type')
        if geom_type in ('Polygon', 'MultiPolygon'):
            return from_shape(shape(geom_data), srid=4326)

    geom_pt_data = data.get('geom_pt')
    if geom_pt_data:
        if isinstance(geom_pt_data, str):
            geom_pt_data = json.loads(geom_pt_data)
        if geom_pt_data.get('type') == 'Point':
            coords = geom_pt_data.get('coordinates') or []
            if len(coords) >= 2:
                lng, lat = float(coords[0]), float(coords[1])
                return WKTElement(f'POINT({lng} {lat})', srid=4326)

    position_x = data.get('position_x')
    position_y = data.get('position_y')
    if position_x is not None and position_y is not None:
        try:
            lng = float(position_x)
            lat = float(position_y)
        except (TypeError, ValueError):
            return None
        if -180 <= lng <= 180 and -90 <= lat <= 90:
            return WKTElement(f'POINT({lng} {lat})', srid=4326)

    return None


@bp.route('/departements/intersects', methods=['POST'])
@check_auth(1)
def getDepartementsByIntersection():
    data = request.get_json() or {}
    site_geom = _site_geometry_from_request(data)
    if site_geom is None:
        logger.info("📍 Intersection départements : aucune géométrie fournie")
        return jsonify([])

    logger.info("📍 Recherche des départements intersectant la géométrie du site")
    departements = (
        Departement.query
        .filter(Departement.geom.isnot(None))
        .filter(func.ST_Intersects(Departement.geom, site_geom))
        .options(selectinload(Departement.region))
        .all()
    )
    schema = DepartementLiteSchema(many=True)
    departements_obj = schema.dump(departements)
    logger.info(f"📦 {len(departements_obj)} département(s) intersecté(s)")
    return jsonify(departements_obj)


@bp.route('/departements', methods=['GET'])
@check_auth(1)
def getAllDepartements():
    if request.method == 'GET':
        logger.info("📋 Récupération de tous les départements")
        departements = Departement.query.all()
        schema = DepartementLiteSchema(many=True)
        departementsObj = schema.dump(departements)
        logger.info(f"📦 {len(departements)} départements récupérés")
        return jsonify(departementsObj)

@bp.route('/departements/<mnemonique>', methods=['GET'])
@check_auth(1)
def getAllDepartementsByUSer(mnemonique):
    if request.method == 'GET':
        logger.info(f"📋 Récupération des départements par mnemonique = {mnemonique}")
        departements = Departement.query.filter_by(mnemonique=mnemonique).all()
        schema = DepartementLiteSchema(many=True)
        departementsObj = schema.dump(departements)
        logger.info(f"📦 {len(departements)} départements trouvés pour '{mnemonique}'")
        return jsonify(departementsObj)

def changeValuesDepartement(departement, data):
    logger.debug(f"🔄 Mise à jour des champs du département avec : {data}")
    departement.libelle = data['nom']
    departement.mnemonique = data['position_x']
    return departement

def getDepartement(departement):
    logger.debug(f"📤 Sérialisation du département ID={departement.id_departement}")
    schema = DepartementSchema(many=False)
    departementObj = schema.dump(departement)
    return jsonify(departementObj)