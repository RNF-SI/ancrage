# Import du db défini dans app.py
from flask_sqlalchemy import SQLAlchemy
from geoalchemy2 import Geometry
from sqlalchemy.dialects.postgresql import VARCHAR

db = SQLAlchemy() # Lie notre app à SQLAlchemy

class Region(db.Model):
    __tablename__ = 't_regions'

    id_region = db.Column(db.Integer, primary_key=True)
    geom = db.Column(Geometry('MULTIPOLYGON', srid=4326))
    id_reg = db.Column(VARCHAR(24))
    nom_reg_m = db.Column(VARCHAR(35))
    nom_reg = db.Column(VARCHAR(35))
    insee_reg = db.Column(VARCHAR(2),unique=True)

    departements = db.relationship(
        'Departement',
        back_populates='region'
    )

class Departement(db.Model):
    __tablename__ = 't_departement'

    id_departement = db.Column(db.Integer, primary_key=True)
    geom = db.Column(Geometry('MULTIPOLYGON', srid=4326))
    id_dep = db.Column(VARCHAR(24))
    nom_dep_m = db.Column(VARCHAR(30))
    nom_dep = db.Column(VARCHAR(30))
    insee_dep = db.Column(VARCHAR(3),unique=True)
    insee_reg = db.Column(VARCHAR(2),db.ForeignKey('t_regions.insee_reg'))
    sites = db.relationship('SiteDepartement', back_populates='departement')
    region = db.relationship('Region', back_populates='departements')
    communes = db.relationship(
        'Commune',
        back_populates='departement',
        lazy=True
    )

class SiteDepartement(db.Model):
    __tablename__ = 'cor_site_departement'
    id_site_departement = db.Column(db.Integer, primary_key=True)
    site_id = db.Column(db.Integer, db.ForeignKey('t_sites.id_site'))
    departement_id = db.Column(db.Integer, db.ForeignKey('t_departement.id_departement'))
    site = db.relationship('Site', back_populates='departements')
    departement = db.relationship('Departement', back_populates='sites')

class Commune(db.Model):
    __tablename__ = 't_communes'

    id_commune = db.Column(db.String, primary_key=True)
    geom = db.Column(Geometry('MULTIPOLYGON', srid=4326))
    nom_com = db.Column(VARCHAR(50))
    nom_com_m = db.Column(VARCHAR(50))
    insee_com = db.Column(VARCHAR(5),unique=True)
    statut = db.Column(VARCHAR(24))
    population = db.Column(db.Integer)
    insee_can = db.Column(VARCHAR(5))
    insee_arr = db.Column(VARCHAR(2))
    insee_dep = db.Column(VARCHAR(3),db.ForeignKey('t_departement.insee_dep'))
    departement = db.relationship('Departement', back_populates='communes')
    insee_reg = db.Column(VARCHAR(2))
    code_epci = db.Column(VARCHAR(20))

class Site(db.Model):
    __tablename__ = 't_sites'
    id_site = db.Column( db.Integer, primary_key=True)
    nom = db.Column(db.String, nullable=False)
    position_x = db.Column(db.String, nullable=False)
    position_y = db.Column(db.String, nullable=False)
    diagnostics = db.relationship('DiagnosticsSites', back_populates='site')
    type_id = db.Column(db.Integer, db.ForeignKey('t_nomenclatures.id_nomenclature'))
    type = db.relationship('Nomenclature', foreign_keys=[type_id], backref='sites_as_type')
    departements = db.relationship('SiteDepartement', back_populates='site')
    habitats = db.relationship('SiteHabitat', back_populates='site')
    created_at = db.Column(db.DateTime)
    modified_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer)
    modified_by = db.Column(db.Integer)

class SiteHabitat(db.Model):
    __tablename__ = 'cor_site_habitat'
    id_site_habitat = db.Column(db.Integer, primary_key=True)
    site_id = db.Column(db.Integer, db.ForeignKey('t_sites.id_site'))
    habitat_id = db.Column(db.Integer, db.ForeignKey('t_nomenclatures.id_nomenclature'))
    site = db.relationship('Site', back_populates='habitats')
    habitat = db.relationship('Nomenclature', back_populates='sites')

class DiagnosticsSites(db.Model):
    __tablename__ = 'cor_diagnostics_sites'
    id_diagnostic_site = db.Column(db.Integer, primary_key=True)
    site_id = db.Column(db.Integer, db.ForeignKey('t_sites.id_site'))
    diagnostic_id = db.Column(db.Integer, db.ForeignKey('t_diagnostics.id_diagnostic'))
    site = db.relationship('Site', back_populates='diagnostics')
    diagnostic = db.relationship('Diagnostic', back_populates='sites')

class Diagnostic(db.Model):
    __tablename__ = 't_diagnostics'
    id_diagnostic = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String, nullable=False)
    date_debut = db.Column(db.DateTime, nullable=False)
    date_fin = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime)
    modified_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer)
    is_read_only = db.Column(db.Boolean,default='0')
    acteurs = db.relationship('Acteur', backref='diagnostic')
    documents = db.relationship('Document', backref='diagnostic')
    sites = db.relationship('DiagnosticsSites', back_populates='diagnostic')
    statut_entretien_id = db.Column(db.Integer, db.ForeignKey('t_nomenclatures.id_nomenclature'))
    statut_entretien = db.relationship('Nomenclature', foreign_keys=[statut_entretien_id])
    
class Document(db.Model):
    __tablename__ = 't_documents'
    id_document = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String, nullable=False)
    diagnostic_id = db.Column(db.Integer, db.ForeignKey('t_diagnostics.id_diagnostic'))

class Acteur(db.Model):
    __tablename__ = 't_acteurs'
    id_acteur = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String, nullable=False)
    prenom = db.Column(db.String, nullable=False)
    fonction = db.Column(db.Integer)
    telephone = db.Column(db.String)
    mail = db.Column(db.String)
    commune_id = db.Column(db.String, db.ForeignKey('t_communes.id_commune'))
    profil_cognitif_id = db.Column(db.Integer)
    is_acteur_economique = db.Column(db.Boolean, nullable=False)
    structure = db.Column(db.String)
    diagnostic_id = db.Column(db.Integer, db.ForeignKey('t_diagnostics.id_diagnostic'))
    created_at = db.Column(db.DateTime)
    modified_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer)
    modified_by = db.Column(db.Integer)
    commune = db.relationship("Commune", backref="acteurs")
    categories = db.relationship('CategoriesActeurs', back_populates='acteur')

class Reponse(db.Model):
    __tablename__ = 't_reponses'
    id_reponse = db.Column(db.Integer, primary_key=True)
    mot_cle_id = db.Column(db.Integer)
    valeur_reponse_id = db.Column(db.Integer)
    mots_cles = db.relationship('ReponseMotCle', back_populates='reponse')


class ReponseMotCle(db.Model):
    __tablename__ = 'cor_reponses_mots_cles'
    id_reponse_mot_cle = db.Column(db.Integer, primary_key=True)
    mot_cle_id = db.Column(db.Integer, db.ForeignKey('t_mots_cles.id_mot_cle'))
    reponse_id = db.Column(db.Integer, db.ForeignKey('t_reponses.id_reponse'))
    mot_cle = db.relationship('MotCle', back_populates='reponses')
    reponse = db.relationship('Reponse', back_populates='mots_cles')


class MotCle(db.Model):
    __tablename__ = 't_mots_cles'
    id_mot_cle = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String)  # probablement String au lieu d'Integer
    reponses = db.relationship('ReponseMotCle', back_populates='mot_cle')

class Nomenclature(db.Model):
    __tablename__ = 't_nomenclatures'
    id_nomenclature = db.Column('id_nomenclature', db.Integer, primary_key=True)
    libelle = db.Column(db.String)
    value = db.Column(db.Integer)
    mnemonique = db.Column(db.String)
    sites = db.relationship('SiteHabitat', back_populates='habitat')
    acteurs = db.relationship('CategoriesActeurs', back_populates='categorie')

class CategoriesActeurs(db.Model):
    __tablename__ = 'cor_categories_acteurs'
    id_categories_acteurs = db.Column(db.Integer, primary_key=True)
    acteur_id = db.Column(db.Integer, db.ForeignKey('t_acteurs.id_acteur'))
    categorie_acteur_id = db.Column(db.Integer, db.ForeignKey('t_nomenclatures.id_nomenclature'))
    categorie = db.relationship('Nomenclature', back_populates='acteurs')
    acteur = db.relationship('Acteur', back_populates='categories')
