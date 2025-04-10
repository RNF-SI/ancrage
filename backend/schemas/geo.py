from models.models import Region,Departement,Commune
from marshmallow import fields
from app import ma
from app import db

class RegionSchema(ma.SQLAlchemyAutoSchema):
    geom = fields.Method("get_geom")
    class Meta:
        model = Region
        include_relationships = True
        load_instance = True
 

class DepartementSchema(ma.SQLAlchemyAutoSchema):
    geom = fields.Method("get_geom")
    class Meta:
        model = Departement
        include_relationships = True
        load_instance = True

class CommuneSchema(ma.SQLAlchemyAutoSchema):
    geom = fields.Method("get_geom")

    class Meta:
        model = Commune
        load_instance = True

def get_geom(self, obj):
    # Retourne un GeoJSON à partir de la géométrie PostGIS
    return db.session.scalar(obj.geom.ST_AsGeoJSON()) if obj.geom else None