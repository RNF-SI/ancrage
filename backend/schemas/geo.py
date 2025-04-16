from models.models import Region,Departement,Commune
from marshmallow import fields
from models.models import db
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

class RegionSchema(SQLAlchemyAutoSchema):
    departements = fields.Nested(lambda: DepartementSchema, many=True, exclude=("region",))
    geom = fields.Method("get_geom")
    class Meta:
        model = Region
        include_relationships = True
        load_instance = True
    def get_geom(self, obj):
        # Retourne un GeoJSON à partir de la géométrie PostGIS
        return db.session.scalar(obj.geom.ST_AsGeoJSON()) if obj.geom else None
 

class DepartementSchema(SQLAlchemyAutoSchema):
    geom = fields.Method("get_geom")
    region = fields.Nested(lambda: RegionSchema, exclude=("departements",))
    class Meta:
        model = Departement
        include_relationships = True
        load_instance = True
    def get_geom(self, obj):
        # Retourne un GeoJSON à partir de la géométrie PostGIS
        return db.session.scalar(obj.geom.ST_AsGeoJSON()) if obj.geom else None

class CommuneSchema(SQLAlchemyAutoSchema):
    geom = fields.Method("get_geom")

    class Meta:
        model = Commune
        load_instance = True
    def get_geom(self, obj):
        # Retourne un GeoJSON à partir de la géométrie PostGIS
        return db.session.scalar(obj.geom.ST_AsGeoJSON()) if obj.geom else None