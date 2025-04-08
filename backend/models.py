
# Import du db défini dans app.py
from app import db
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from geoalchemy2 import Geometry
from sqlalchemy.dialects.postgresql import VARCHAR


class Region(db.Model):
    __tablename__ = 'region'
    __table_args__ = {'schema': 'limites_admin'}

    id = db.Column(db.Integer, primary_key=True)
    geom = db.Column(Geometry('MULTIPOLYGON', srid=4326))
    id_reg = db.Column(VARCHAR(24))
    nom_reg_m = db.Column(VARCHAR(35))
    nom_reg = db.Column(VARCHAR(35))
    insee_reg = db.Column(VARCHAR(2))

    departements = db.relationship('Departement', backref='region', primaryjoin='Region.insee_reg == foreign(Departement.insee_reg)', lazy=True)


class Departement(db.Model):
    __tablename__ = 'departement'
    __table_args__ = {'schema': 'limites_admin'}

    id = db.Column(db.Integer, primary_key=True)
    geom = db.Column(Geometry('MULTIPOLYGON', srid=4326))
    id_dep = db.Column(VARCHAR(24))
    nom_dep_m = db.Column(VARCHAR(30))
    nom_dep = db.Column(VARCHAR(30))
    insee_dep = db.Column(VARCHAR(3))
    insee_reg = db.Column(VARCHAR(2))

    communes = db.relationship('Commune', backref='departement', primaryjoin='Departement.insee_dep == foreign(Commune.insee_dep)', lazy=True)


class Commune(db.Model):
    __tablename__ = 'commune'
    __table_args__ = {'schema': 'limites_admin'}

    id = db.Column(db.String, primary_key=True)
    geom = db.Column(Geometry('MULTIPOLYGON', srid=4326))
    nom_com = db.Column(VARCHAR(50))
    nom_com_m = db.Column(VARCHAR(50))
    insee_com = db.Column(VARCHAR(5))
    statut = db.Column(VARCHAR(24))
    population = db.Column(db.Integer)
    insee_can = db.Column(VARCHAR(5))
    insee_arr = db.Column(VARCHAR(2))
    insee_dep = db.Column(VARCHAR(3))
    insee_reg = db.Column(VARCHAR(2))
    code_epci = db.Column(VARCHAR(20))

class Site(db.Model):
    __tablename__ = 't_sites'
    id = db.Column('id_site', db.Integer, primary_key=True)
    nom = db.Column(db.String, nullable=False)
    position_x = db.Column(db.String, nullable=False)
    position_y = db.Column(db.String, nullable=False)
    diagnostic_id = db.Column(db.Integer, db.ForeignKey('t_diagnostics.id_diagnostic'))
    type_id = db.Column(db.Integer)
    habitat_id = db.Column(db.Integer)
    created_at = db.Column(db.DateTime)
    modified_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer)
    modified_by = db.Column(db.Integer)
    entretiens = db.relationship('Entretien', backref='site')

class Diagnostic(db.Model):
    __tablename__ = 't_diagnostics'
    id = db.Column('id_diagnostic', db.Integer, primary_key=True)
    nom = db.Column(db.String, nullable=False)
    date_debut = db.Column(db.DateTime, nullable=False)
    date_fin = db.Column(db.DateTime)
    rapport = db.Column(db.Text)
    site_id = db.Column(db.Integer, db.ForeignKey('t_sites.id_site'))
    created_at = db.Column(db.DateTime)
    modified_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer)
    acteurs = db.relationship('Acteur', backref='diagnostic')
    documents = db.relationship('Document', backref='diagnostic')
    entretiens = db.relationship('Entretien', backref='diagnostic')

class Document(db.Model):
    __tablename__ = 't_documents'
    id = db.Column('id_document', db.Integer, primary_key=True)
    nom = db.Column(db.String, nullable=False)
    diagnostic_id = db.Column(db.Integer, db.ForeignKey('t_diagnostics.id_diagnostic'))

class Entretien(db.Model):
    __tablename__ = 't_entretiens'
    id = db.Column('id_entretien', db.Integer, primary_key=True)
    site_id = db.Column(db.Integer, db.ForeignKey('t_sites.id_site'))
    date_entretien = db.Column(db.DateTime, nullable=False)
    contexte = db.Column(db.Integer, nullable=False)
    statut_id = db.Column(db.Integer)
    diagnostic_id = db.Column(db.Integer, db.ForeignKey('t_diagnostics.id_diagnostic'))
    created_at = db.Column(db.DateTime)
    modified_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer)
    acteurs = db.relationship('Acteur', backref='entretien')
    reponses = db.relationship('Reponse', backref='entretien')

class Acteur(db.Model):
    __tablename__ = 't_acteurs'
    id = db.Column('id_acteur', db.Integer, primary_key=True)
    nom = db.Column(db.String, nullable=False)
    prenom = db.Column(db.String, nullable=False)
    fonction = db.Column(db.Integer)
    telephone = db.Column(db.String)
    mail = db.Column(db.String)
    commune_id = db.Column(db.Integer, db.ForeignKey('t_communes.id_commune'))
    profil_cognitif_id = db.Column(db.Integer)
    is_acteur_economique = db.Column(db.Boolean, nullable=False)
    structure = db.Column(db.String)
    diagnostic_id = db.Column(db.Integer, db.ForeignKey('t_diagnostics.id_diagnostic'))
    entretien_id = db.Column(db.Integer, db.ForeignKey('t_entretiens.id_entretien'))
    created_at = db.Column(db.DateTime)
    modified_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer)
    modified_by = db.Column(db.Integer)

class Reponse(db.Model):
    __tablename__ = 't_reponses'
    id = db.Column('id_reponse', db.Integer, primary_key=True)
    mot_cle_id = db.Column(db.Integer)
    valeur_reponse_id = db.Column(db.Integer)
    entretien_id = db.Column(db.Integer, db.ForeignKey('t_entretiens.id_entretien'))
    mots_cles = db.relationship('ReponseMotCle', backref='reponse')

class ReponseMotCle(db.Model):
    __tablename__ = 'cor_reponses_mots_cles'
    id = db.Column('id_reponse_mot_cle', db.Integer, primary_key=True)
    mot_cle_id = db.Column(db.Integer, db.ForeignKey('t_mots_cles.id_mot_cle'))
    reponse_id = db.Column(db.Integer, db.ForeignKey('t_reponses.id_reponse'))

class MotCle(db.Model):
    __tablename__ = 't_mots_cles'
    id = db.Column('id_mot_cle', db.Integer, primary_key=True)
    nom = db.Column(db.Integer)

class Nomenclature(db.Model):
    __tablename__ = 't_nomenclatures'
    id = db.Column('id_nomenclature', db.Integer, primary_key=True)
    label = db.Column(db.String)
    type_site_id = db.Column(db.Integer)
    value = db.Column(db.Integer)
    mnemonique = db.Column(db.String)
    profil_cognitif_id = db.Column(db.Integer)
    statut_entretien_id = db.Column(db.Integer)
    habitat_id = db.Column(db.Integer)