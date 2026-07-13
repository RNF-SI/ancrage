import json

from sqlalchemy import func

from models.models import Acteur, Diagnostic, Document, MotCle, Nomenclature, Reponse, Site,Question, Region,Departement,Commune,db
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow import fields


def _geometry_as_geojson(geometry):
    if geometry is None:
        return None
    geojson = db.session.scalar(func.ST_AsGeoJSON(geometry))
    if not geojson:
        return None
    return json.loads(geojson) if isinstance(geojson, str) else geojson


def _point_geojson_from_positions(position_x, position_y):
    try:
        lng = float(position_x)
        lat = float(position_y)
    except (TypeError, ValueError):
        return None
    if not (-180 <= lng <= 180 and -90 <= lat <= 90):
        return None
    return {"type": "Point", "coordinates": [lng, lat]}


def _serialize_site_geom(site):
    return _geometry_as_geojson(getattr(site, "geom", None))


def _serialize_site_geom_pt(site):
    geom_pt = _geometry_as_geojson(getattr(site, "geom_pt", None))
    if geom_pt:
        return geom_pt
    return _point_geojson_from_positions(site.position_x, site.position_y)


def enrich_site_dump(site_dump, site):
    """Garantit geom / geom_pt dans le JSON même si Marshmallow les omet."""
    site_dump["geom"] = _serialize_site_geom(site)
    site_dump["geom_pt"] = _serialize_site_geom_pt(site)
    return site_dump

class RegionLiteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Region
        load_instance = True
        exclude = ('geom', 'departements')


class DepartementLiteSchema(SQLAlchemyAutoSchema):
    region = fields.Nested(lambda: RegionLiteSchema)

    class Meta:
        model = Departement
        load_instance = True
        exclude = ('geom', 'communes', 'sites')


class RegionSchema(SQLAlchemyAutoSchema):
    departements = fields.Nested(lambda: DepartementLiteSchema, many=True, exclude=("region",))
    geom = fields.Method("get_geom")
    class Meta:
        model = Region
        include_relationships = True
        load_instance = True
        exclude = ('geom', 'departements')
    def get_geom(self, obj):
        # Retourne un GeoJSON à partir de la géométrie PostGIS
        return db.session.scalar(obj.geom.ST_AsGeoJSON()) if obj.geom else None
 

class DepartementSchema(SQLAlchemyAutoSchema):
    geom = fields.Method("get_geom")
    region = fields.Nested(lambda: RegionLiteSchema)
    sites = fields.Nested(lambda: SiteSchema, many=True, exclude=("departements",))

    class Meta:
        model = Departement
        include_relationships = True
        load_instance = True
        exclude = ('geom', 'communes', 'sites')
        
    def get_geom(self, obj):
        return db.session.scalar(obj.geom.ST_AsGeoJSON()) if obj.geom else None


def _commune_code_dpt(obj):
    if obj.insee_com and len(obj.insee_com) >= 2:
        return obj.insee_com[:2]
    return None


class CommuneLiteSchema(SQLAlchemyAutoSchema):
    departement = fields.Nested(lambda: DepartementLiteSchema)
    code_dpt = fields.Method("get_code_dpt")

    class Meta:
        model = Commune
        load_instance = True
        exclude = (
            'geom', 'code_epci', 'insee_arr', 'insee_can', 'insee_reg',
            'population', 'statut', 'latitude', 'longitude'
        )

    def get_code_dpt(self, obj):
        return _commune_code_dpt(obj)


class CommuneWithLocationSchema(SQLAlchemyAutoSchema):
    """Commune légère avec lat/lng pour la carte des acteurs (sans géométrie PostGIS)."""
    departement = fields.Nested(lambda: DepartementLiteSchema)
    code_dpt = fields.Method("get_code_dpt")

    class Meta:
        model = Commune
        load_instance = True
        exclude = (
            'geom', 'code_epci', 'insee_arr', 'insee_can', 'insee_reg',
            'population', 'statut'
        )

    def get_code_dpt(self, obj):
        return _commune_code_dpt(obj)


class CommuneSchema(SQLAlchemyAutoSchema):
    geom = fields.Method("get_geom")
    departement = fields.Nested(lambda: DepartementLiteSchema)
    code_dpt = fields.Method("get_code_dpt")

    class Meta:
        model = Commune
        load_instance = True
        exclude= ('geom','code_epci','insee_arr','insee_can','insee_reg','population','statut')
    
    def get_geom(self, obj):
        # Retourne un GeoJSON à partir de la géométrie PostGIS
        return db.session.scalar(obj.geom.ST_AsGeoJSON()) if obj.geom else None
    
    def get_code_dpt(self, obj):
        return _commune_code_dpt(obj)


class SiteSchema(SQLAlchemyAutoSchema):
    geom = fields.Function(serialize=_serialize_site_geom, allow_none=True)
    geom_pt = fields.Function(serialize=_serialize_site_geom_pt, allow_none=True)

    class Meta:
        model = Site
        include_relationships = True
        load_instance = True
        exclude = ('geom', 'geom_pt')

    type = fields.Nested(lambda: NomenclatureDiagSchema)
    diagnostics = fields.Method("get_active_diagnostics")
    departements = fields.Method("get_departements_flat")
    """ habitats = fields.Method("get_habitats_flat") """

    def get_active_diagnostics(self, obj):
        active_diags = [d for d in obj.diagnostics if not d.is_disabled]
        return DiagnosticLiteSchema(many=True).dump(active_diags)

    def get_departements_flat(self, obj):
        return [
            DepartementLiteSchema().dump(ds)
            for ds in obj.departements
            if ds
        ]
    """ def get_habitats_flat(self, obj):
        return [
            NomenclatureSchema(exclude=("sites",)).dump(habitat)
            for habitat in obj.habitats
            if habitat
    ] """

class SiteFromDiagSchema(SQLAlchemyAutoSchema):
    geom = fields.Function(serialize=_serialize_site_geom, allow_none=True)
    geom_pt = fields.Function(serialize=_serialize_site_geom_pt, allow_none=True)

    class Meta:
        model = Site
        include_relationships = True
        load_instance = True
        exclude = ('geom', 'geom_pt')

    type = fields.Nested(lambda: NomenclatureDiagSchema)
    departements = fields.Method("get_departements_flat")

    def get_departements_flat(self, obj):
        return [
            DepartementLiteSchema().dump(ds)
            for ds in obj.departements
            if ds
        ]


class DiagnosticSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Diagnostic
        include_relationships = True
        load_instance = True
        
    acteurs = fields.Method("get_active_actors")
    documents = fields.Nested(lambda: DocumentSchema, many=True, exclude=("diagnostic",))
    sites = fields.Nested(lambda: SiteFromDiagSchema, many=True, exclude=('diagnostics',))

    def get_active_actors(self, obj):
        active_actors = [d for d in obj.acteurs if not d.is_deleted]
        return ActeurOnDiagnosticSchema(many=True).dump(active_actors)


class DiagnosticLiteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Diagnostic
        load_instance = True
        exclude =  ("acteurs", "documents",'sites')

class DiagnosticWithSitesSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Diagnostic
        load_instance = True
        exclude =  ("acteurs", "documents")

    sites = fields.Nested(lambda: SiteFromDiagSchema, many=True, exclude=('diagnostics',))

class DocumentSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Document
        include_relationships = True
        load_instance = True

    diagnostic = fields.Nested(lambda: DiagnosticLiteSchema)


class ActeurSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Acteur
        include_relationships = True
        load_instance = True

    diagnostic = fields.Nested(lambda: DiagnosticWithSitesSchema)
    commune = fields.Nested(lambda: CommuneSchema)
    categories = fields.Nested(lambda: NomenclatureLightSchema, many=True)
    reponses = fields.Nested(lambda: ReponseSchema, many=True,exclude=("acteur",))
    profil = fields.Nested(lambda: NomenclatureLightSchema)
    statut_entretien = fields.Nested(lambda: NomenclatureLightSchema)

class ActeurWithoutResponsesSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Acteur
        include_relationships = True
        load_instance = True

    diagnostic = fields.Nested(lambda: DiagnosticWithSitesSchema)
    commune = fields.Nested(lambda: CommuneLiteSchema)
    categories = fields.Nested(lambda: NomenclatureLightSchema, many=True)
    profil = fields.Nested(lambda: NomenclatureLightSchema)
    statut_entretien = fields.Nested(lambda: NomenclatureLightSchema)


class ActeurOnDiagnosticSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Acteur
        load_instance = True
        exclude = ('reponses',)

    commune = fields.Nested(lambda: CommuneWithLocationSchema)
    categories = fields.Nested(lambda: NomenclatureLightSchema, many=True)
    profil = fields.Nested(lambda: NomenclatureLightSchema)
    statut_entretien = fields.Nested(lambda: NomenclatureLightSchema)


class ReponseExportSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Reponse
        include_relationships = True
        load_instance = True

    question = fields.Nested(
        lambda: QuestionSchema,
        exclude=("reponses", "choixReponses", "theme", "theme_question"),
    )
    valeur_reponse = fields.Nested(lambda: NomenclatureLightSchema)


class ActeurExportSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Acteur
        load_instance = True

    categories = fields.Nested(lambda: NomenclatureLightSchema, many=True)
    reponses = fields.Nested(lambda: ReponseExportSchema, many=True, exclude=("acteur", "mots_cles"))


class ActeurImportSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Acteur
        load_instance = True

    diagnostic = fields.Nested(lambda: DiagnosticLiteSchema)
    commune = fields.Nested(lambda: CommuneLiteSchema)
    categories = fields.Nested(lambda: NomenclatureLightSchema, many=True)
    profil = fields.Nested(lambda: NomenclatureLightSchema)
    statut_entretien = fields.Nested(lambda: NomenclatureLightSchema)


class QuestionSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Question
        include_relationships = True
        load_instance = True

    choixReponses = fields.Nested(lambda: NomenclatureSchema, exclude=("questions",))
    reponses = fields.Nested(lambda: ReponseSchema, exclude=("question",))
    theme = fields.Nested(lambda: NomenclatureSchema, exclude=("questions",))

class ActeurLiteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Acteur
        load_instance = True
        exclude = ('diagnostic',)
    commune = fields.Nested(lambda: CommuneLiteSchema)
    categories = fields.Nested(lambda: NomenclatureLightSchema, many=True, exclude=("mots_cles",))

class ReponseSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Reponse
        include_relationships = True
        load_instance = True

    mots_cles = fields.Nested(lambda: MotCleSchema, many=True, exclude=("reponses",))
    question = fields.Nested(lambda: QuestionSchema, exclude=("reponses",))
    acteur = fields.Nested(lambda: ActeurLiteSchema)
    valeur_reponse = fields.Nested(lambda: NomenclatureLightSchema)


class MotCleSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = MotCle
        include_relationships = True
        load_instance = True
        exclude = ('reponses',)

    reponses = fields.Nested(lambda: ReponseSchema, many=True, exclude=("mots_cles",))
    categorie = fields.Nested(lambda: NomenclatureLightSchema, many=False, exclude=("mots_cles",))
    mots_cles_issus = fields.Nested(
        lambda: MotCleSchema(many=True, exclude=("mots_cles_issus",)),
        dump_only=True
    )

class NomenclatureSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Nomenclature
        load_instance = True
        exclude = ('acteurs_c','acteurs_p',)

    acteurs_c = fields.Nested(lambda: ActeurSchema, many=True, exclude=("categories", "diagnostic",))
    acteurs_p = fields.Nested(lambda: ActeurSchema, many=True, exclude=("categories", "diagnostic",))
    sites = fields.Nested(lambda: SiteSchema, many=True, exclude=("habitats",))
    questions = fields.Nested(lambda: QuestionSchema, many=True, exclude=("theme",))
    mots_cles = fields.Nested(lambda: MotCleSchema, many=True, exclude=("categorie",))

class NomenclatureDiagSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Nomenclature
        load_instance = True
        exclude = ('acteurs_c','acteurs_p','sites','questions','mots_cles',)

    acteurs_c = fields.Nested(lambda: ActeurSchema, many=True, exclude=("categories", "diagnostic",))
    acteurs_p = fields.Nested(lambda: ActeurSchema, many=True, exclude=("categories", "diagnostic",))
    sites = fields.Nested(lambda: SiteSchema, many=True, exclude=("habitats",))
    questions = fields.Nested(lambda: QuestionSchema, many=True, exclude=("theme",))
    mots_cles = fields.Nested(lambda: MotCleSchema, many=True, exclude=("categorie",))

class NomenclatureLightSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Nomenclature
        include_fk = True
        load_instance = True
        exclude = ("mots_cles","acteurs_c","acteurs_p","sites","questions")