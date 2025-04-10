from schemas.geo import CommuneSchema
from models.models import Acteur, Diagnostic, Document, Entretien, MotCle, Nomenclature, Reponse, ReponseMotCle, Site
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema
from marshmallow import fields

class SiteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Site
        include_relationships = True
        load_instance = True

    diagnostics = fields.Nested(lambda: DiagnosticLiteSchema, many=True)


class DiagnosticSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Diagnostic
        include_relationships = True
        load_instance = True

    site = fields.Nested(lambda: SiteSchema, exclude=("diagnostics",))
    acteurs = fields.Nested(lambda: ActeurSchema, many=True)
    documents = fields.Nested(lambda: DocumentSchema, many=True, exclude=("diagnostic",))
    entretiens = fields.Nested(lambda: EntretienLiteSchema, many=True)


class DiagnosticLiteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Diagnostic
        load_instance = True
        exclude = ("site", "acteurs", "documents", "entretiens")


class DocumentSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Document
        include_relationships = True
        load_instance = True

    diagnostic = fields.Nested(lambda: DiagnosticLiteSchema)


class EntretienSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Entretien
        include_relationships = True
        load_instance = True

    diagnostic = fields.Nested(lambda: DiagnosticLiteSchema)
    acteurs = fields.Nested(lambda: ActeurLiteSchema, many=True)
    reponses = fields.Nested(lambda: ReponseSchema, many=True, exclude=("entretien",))


class EntretienLiteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Entretien
        load_instance = True
        exclude = ("diagnostic", "acteurs", "reponses")


class ActeurSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Acteur
        include_relationships = True
        load_instance = True

    diagnostic = fields.Nested(lambda: DiagnosticLiteSchema)
    entretien = fields.Nested(lambda: EntretienLiteSchema)
    commune = fields.Nested(lambda: CommuneSchema)


class ActeurLiteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Acteur
        load_instance = True
        exclude = ("diagnostic", "entretien")
    commune = fields.Nested(lambda: CommuneSchema, exclude=())

class ReponseSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Reponse
        include_relationships = True
        load_instance = True

    entretien = fields.Nested(lambda: EntretienLiteSchema)
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
