from models.models import Acteur, Diagnostic, Document, MotCle, Nomenclature, Reponse, Site,Question, Region,Departement,Commune,db
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow import fields

class RegionSchema(SQLAlchemyAutoSchema):
    departements = fields.Nested(lambda: DepartementSchema, many=True, exclude=("region",))
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
    region = fields.Nested(lambda: RegionSchema, exclude=("departements",))
    sites = fields.Nested(lambda: SiteSchema, many=True, exclude=("departements",))

    class Meta:
        model = Departement
        include_relationships = True
        load_instance = True
        exclude = ('geom', 'communes', 'sites')
        
    def get_geom(self, obj):
        return db.session.scalar(obj.geom.ST_AsGeoJSON()) if obj.geom else None

class CommuneSchema(SQLAlchemyAutoSchema):
    geom = fields.Method("get_geom")

    class Meta:
        model = Commune
        load_instance = True
    def get_geom(self, obj):
        # Retourne un GeoJSON à partir de la géométrie PostGIS
        return db.session.scalar(obj.geom.ST_AsGeoJSON()) if obj.geom else None


class SiteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Site
        include_relationships = True
        load_instance = True

    type = fields.Nested(lambda: NomenclatureSchema, exclude=("sites",))
    diagnostics = fields.Nested(lambda: DiagnosticSchema, many=True, exclude=('sites',))
    departements = fields.Method("get_departements_flat")
    habitats = fields.Method("get_habitats_flat")

    def get_diagnostics_flat(self, obj):
        return [DiagnosticLiteSchema().dump(ds.diagnostic) for ds in obj.diagnostics if ds.diagnostic]
    def get_departements_flat(self, obj):
        return [
            DepartementSchema(exclude=("sites",)).dump(ds)
            for ds in obj.departements
            if ds
        ]
    def get_habitats_flat(self, obj):
        return [
            NomenclatureSchema(exclude=("sites",)).dump(habitat)
            for habitat in obj.habitats
            if habitat
    ]

class DiagnosticSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Diagnostic
        include_relationships = True
        load_instance = True

    acteurs = fields.Nested(lambda: ActeurSchema, many=True, exclude=('diagnostic',))
    documents = fields.Nested(lambda: DocumentSchema, many=True, exclude=("diagnostic",))
    sites = fields.Nested(lambda: SiteSchema, many=True, exclude=('diagnostics',))

    def get_sites_flat(self, obj):
        return [SiteSchema().dump(ds.site) for ds in obj.sites]

class DiagnosticLiteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Diagnostic
        load_instance = True
        exclude =  ("acteurs", "documents",)


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
        exclude = ('diagnostic',)

    diagnostic = fields.Nested(lambda: DiagnosticLiteSchema)
    commune = fields.Nested(lambda: CommuneSchema)
    categories = fields.Nested(lambda: NomenclatureSchema, many=True)
    questions = fields.Nested(lambda: QuestionSchema, many=True)
    profil = fields.Nested(lambda: NomenclatureSchema)

class QuestionSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Question
        include_relationships = True
        load_instance = True

    acteurs = fields.Nested(lambda: ActeurSchema, exclude=("questions",))
    reponses = fields.Nested(lambda: ReponseSchema, exclude=("question",))

class ActeurLiteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Acteur
        load_instance = True
        exclude = ('diagnostic',)
    commune = fields.Nested(lambda: CommuneSchema, exclude=())

class ReponseSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Reponse
        include_relationships = True
        load_instance = True

    mots_cles = fields.Nested(lambda: MotCleSchema, many=True, exclude=("reponses",))
    question = fields.Nested(lambda: QuestionSchema, exclude=("reponses",))

class MotCleSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = MotCle
        include_relationships = True
        load_instance = True

    reponses = fields.Nested(lambda: ReponseSchema, many=True, exclude=("mots_cles",))


class NomenclatureSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Nomenclature
        load_instance = True
        exclude = ('acteurs_c','acteurs_p',)

    acteurs_c = fields.Nested(lambda: ActeurSchema, many=True, exclude=("categories", "diagnostic",))
    acteurs_p = fields.Nested(lambda: ActeurSchema, many=True, exclude=("categories", "diagnostic",))
    sites = fields.Nested(lambda: SiteSchema, many=True, exclude=("habitats",))
