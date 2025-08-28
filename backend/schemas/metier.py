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
    departement = fields.Nested(lambda: DepartementSchema, exclude=("communes",))

    class Meta:
        model = Commune
        load_instance = True
        exclude= ('geom','code_epci','insee_arr','insee_can','insee_reg','population','statut')
    def get_geom(self, obj):
        # Retourne un GeoJSON à partir de la géométrie PostGIS
        return db.session.scalar(obj.geom.ST_AsGeoJSON()) if obj.geom else None


class SiteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Site
        include_relationships = True
        load_instance = True

    type = fields.Nested(lambda: NomenclatureDiagSchema)
    diagnostics = fields.Method("get_active_diagnostics")
    departements = fields.Method("get_departements_flat")
    """ habitats = fields.Method("get_habitats_flat") """

    def get_active_diagnostics(self, obj):
        active_diags = [d for d in obj.diagnostics if not d.is_disabled]
        return DiagnosticLiteSchema(many=True).dump(active_diags)

    def get_departements_flat(self, obj):
        return [
            DepartementSchema(exclude=("sites",)).dump(ds)
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
    class Meta:
        model = Site
        include_relationships = True
        load_instance = True

    type = fields.Nested(lambda: NomenclatureDiagSchema)
    departements = fields.Method("get_departements_flat")

    def get_departements_flat(self, obj):
        return [
            DepartementSchema(exclude=("sites",)).dump(ds)
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
        return ActeurSchema(many=True, exclude=('diagnostic',)).dump(active_actors)


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
    commune = fields.Nested(lambda: CommuneSchema)
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
    commune = fields.Nested(lambda: CommuneSchema, exclude=())
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