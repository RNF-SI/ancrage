from schemas.geo import CommuneSchema
from models.models import Acteur, Diagnostic, Document, MotCle, Nomenclature, Reponse, ReponseMotCle, Site,DiagnosticsSites,CategoriesActeurs
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow import fields

class SiteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Site
        include_relationships = True
        load_instance = True

    type = fields.Nested(lambda: NomenclatureSchema)
    diagnostics = fields.Method("get_diagnostics_flat")

    def get_diagnostics_flat(self, obj):
        return [DiagnosticLiteSchema().dump(ds.diagnostic) for ds in obj.diagnostics if ds.diagnostic]
    
class SitesDiagnosticsSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = DiagnosticsSites
        include_relationships = True
        load_instance = True

    site = fields.Nested(lambda: SiteSchema, exclude=("diagnostics",))
    diagnostic = fields.Nested(lambda: DiagnosticSchema, exclude=("sites",))


class DiagnosticSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Diagnostic
        include_relationships = True
        load_instance = True

    acteurs = fields.Nested(lambda: ActeurSchema, many=True, exclude=('diagnostic',))
    documents = fields.Nested(lambda: DocumentSchema, many=True, exclude=("diagnostic",))
    sites = fields.Method("get_sites_flat")

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

    diagnostic = fields.Nested(lambda: DiagnosticLiteSchema)
    commune = fields.Nested(lambda: CommuneSchema)
    categories = fields.Nested(lambda: NomenclatureSchema, many=True)

class CategoriesActeursSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = CategoriesActeurs
        include_relationships = True
        load_instance = True

    categorie = fields.Nested(lambda: NomenclatureSchema, exclude=("acteurs",))
    acteur = fields.Nested(lambda: Acteur, exclude=("categories",))

class ActeurLiteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Acteur
        load_instance = True
        exclude = ("diagnostic",)
    commune = fields.Nested(lambda: CommuneSchema, exclude=())

class ReponseSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Reponse
        include_relationships = True
        load_instance = True

    mots_cles = fields.Nested(lambda: ReponseMotCleSchema, many=True, exclude=("reponse",))


class ReponseMotCleSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = ReponseMotCle
        include_relationships = True
        load_instance = True

    mot_cle = fields.Nested(lambda: MotCleSchema, exclude=("reponses",))
    reponse = fields.Nested(lambda: ReponseSchema, exclude=("mots_cles",))


class MotCleSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = MotCle
        include_relationships = True
        load_instance = True

    reponses = fields.Nested(lambda: ReponseMotCleSchema, many=True, exclude=("mot_cle",))


class NomenclatureSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Nomenclature
        load_instance = True
    acteurs = fields.Nested(lambda: ActeurSchema, many=True)
