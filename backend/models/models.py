# Import du db défini dans app.py
from flask_sqlalchemy import SQLAlchemy
from geoalchemy2 import Geometry
from sqlalchemy.dialects.postgresql import VARCHAR

db = SQLAlchemy() # Lie notre app à SQLAlchemy

site_habitat = db.Table(
    'cor_site_habitat',
    db.Column('site_id', db.Integer, db.ForeignKey('t_sites.id_site', ondelete="CASCADE")),
    db.Column('habitat_id', db.Integer, db.ForeignKey('t_nomenclatures.id_nomenclature', ondelete="CASCADE"))
)

site_departement = db.Table(
    'cor_site_departement',
    db.Column('site_id', db.Integer, db.ForeignKey('t_sites.id_site', ondelete="CASCADE")),
    db.Column('departement_id', db.Integer, db.ForeignKey('t_departement.id_departement', ondelete="CASCADE"))
)

class Region(db.Model):
    __tablename__ = 't_regions'

    id_region = db.Column(db.Integer, primary_key=True)
    geom = db.Column(Geometry('MULTIPOLYGON', srid=4326))
    id_reg = db.Column(VARCHAR(24))
    nom_reg = db.Column(VARCHAR(255))
    insee_reg = db.Column(VARCHAR(255),unique=True)

    departements = db.relationship(
        'Departement',
        back_populates='region'
    )

class Departement(db.Model):
    __tablename__ = 't_departement'

    id_departement = db.Column(db.Integer, primary_key=True)
    geom = db.Column(Geometry('MULTIPOLYGON', srid=4326))
    id_dep = db.Column(VARCHAR(24))
    nom_dep = db.Column(VARCHAR(30))
    insee_dep = db.Column(VARCHAR(255),unique=True)
    insee_reg = db.Column(VARCHAR(255),db.ForeignKey('t_regions.insee_reg'))
    sites = db.relationship('Site', secondary='cor_site_departement', back_populates='departements')
    region = db.relationship('Region', back_populates='departements')
    communes = db.relationship(
        'Commune',
        back_populates='departement',
        lazy=True
    )

class Commune(db.Model):
    __tablename__ = 't_communes'

    id_commune = db.Column(db.Integer, primary_key=True)
    geom = db.Column(Geometry('MULTIPOLYGON', srid=4326))
    nom_com = db.Column(VARCHAR(50))
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
    diagnostics = db.relationship('Diagnostic', secondary='cor_sites_diagnostics', back_populates='sites')
    id_inpn = db.Column(db.String)
    type_id = db.Column(db.Integer, db.ForeignKey('t_nomenclatures.id_nomenclature'))
    type = db.relationship('Nomenclature', foreign_keys=[type_id])
    habitats = db.relationship('Nomenclature', secondary='cor_site_habitat', back_populates='sites')
    departements = db.relationship('Departement', secondary='cor_site_departement', back_populates='sites')
    created_at = db.Column(db.DateTime)
    modified_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer)
    modified_by = db.Column(db.Integer)

site_diagnostic = db.Table(
    'cor_sites_diagnostics',
    db.Column('diagnostic_id', db.Integer, db.ForeignKey('t_diagnostics.id_diagnostic', ondelete="CASCADE")),
    db.Column('site_id', db.Integer, db.ForeignKey('t_sites.id_site', ondelete="CASCADE"))
)

class Diagnostic(db.Model):
    __tablename__ = 't_diagnostics'
    id_diagnostic = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String, nullable=False)
    date_debut = db.Column(db.DateTime)
    date_dernier_entretien = db.Column(db.DateTime)
    date_fin = db.Column(db.DateTime)
    date_rapport = db.Column(db.DateTime)
    identite_createur = db.Column(db.String,default="")
    id_organisme = db.Column(db.Integer)
    created_at = db.Column(db.DateTime)
    modified_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer)
    is_read_only = db.Column(db.Boolean,default=False)
    acteurs = db.relationship('Acteur', back_populates='diagnostic')
    documents = db.relationship('Document', backref='diagnostic')
    sites = db.relationship('Site', secondary='cor_sites_diagnostics', back_populates='diagnostics')
    
    
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
    fonction = db.Column(db.String)
    telephone = db.Column(db.String)
    mail = db.Column(db.String)
    commune_id = db.Column(db.Integer, db.ForeignKey('t_communes.id_commune'))
    is_acteur_economique = db.Column(db.Boolean, nullable=False)
    structure = db.Column(db.String)
    diagnostic_id = db.Column(db.Integer, db.ForeignKey('t_diagnostics.id_diagnostic'))
    diagnostic = db.relationship('Diagnostic', back_populates='acteurs')
    created_at = db.Column(db.DateTime)
    modified_at = db.Column(db.DateTime)
    created_by = db.Column(db.Integer)
    modified_by = db.Column(db.Integer)
    commune = db.relationship("Commune", backref="acteurs")
    categories = db.relationship('Nomenclature', secondary='cor_categorie_acteur', back_populates='acteurs_c')
    reponses = db.relationship('Reponse', back_populates='acteur')
    statut_entretien_id = db.Column(db.Integer, db.ForeignKey('t_nomenclatures.id_nomenclature'))
    profil_cognitif_id = db.Column(db.Integer, db.ForeignKey('t_nomenclatures.id_nomenclature'))
    profil = db.relationship('Nomenclature', foreign_keys=[profil_cognitif_id], back_populates='acteurs_p')
    statut_entretien = db.relationship('Nomenclature', foreign_keys=[statut_entretien_id], back_populates='acteurs_se')
    acteur_origine_id = db.Column(db.Integer, db.ForeignKey('t_acteurs.id_acteur'))
    acteur_origine = db.relationship('Acteur', remote_side=[id_acteur], backref='acteurs_issus')
    is_copy = db.Column(db.Boolean, default=False)

acteur_categorie = db.Table(
    'cor_categorie_acteur',
    db.Column('acteur_id', db.Integer, db.ForeignKey('t_acteurs.id_acteur', ondelete="CASCADE")),
    db.Column('categorie_id', db.Integer, db.ForeignKey('t_nomenclatures.id_nomenclature', ondelete="CASCADE"))
)

acteur_profil = db.Table(
    'cor_profil_acteur',
    db.Column('acteur_id', db.Integer, db.ForeignKey('t_acteurs.id_acteur', ondelete="CASCADE")),
    db.Column('profil_id', db.Integer, db.ForeignKey('t_nomenclatures.id_nomenclature', ondelete="CASCADE"))
)

class Question(db.Model):
    __tablename__ = 't_questions'

    id_question = db.Column(db.Integer, primary_key=True)
    libelle = db.Column(db.String)
    indications = db.Column(db.String)
    reponses = db.relationship(
        'Reponse',
        back_populates='question'
    )
    theme_id = db.Column(db.Integer, db.ForeignKey('t_nomenclatures.id_nomenclature'))
    theme = db.relationship('Nomenclature', foreign_keys=[theme_id])

class Reponse(db.Model):
    __tablename__ = 't_reponses'
    id_reponse = db.Column(db.Integer, primary_key=True)
    valeur_reponse_id = db.Column(db.Integer, db.ForeignKey('t_nomenclatures.id_nomenclature'))
    valeur_reponse = db.relationship('Nomenclature', foreign_keys=[valeur_reponse_id])
    question_id = db.Column(db.Integer, db.ForeignKey('t_questions.id_question'))
    question = db.relationship('Question', foreign_keys=[question_id])
    mots_cles = db.relationship('MotCle', secondary='cor_reponses_mots_cles', back_populates='reponses')
    acteur_id = db.Column(db.Integer, db.ForeignKey('t_acteurs.id_acteur'))
    acteur = db.relationship('Acteur', foreign_keys=[acteur_id])

reponse_mot_cle = db.Table(
    'cor_reponses_mots_cles',
    db.Column('reponse_id', db.Integer, db.ForeignKey('t_reponses.id_reponse', ondelete="CASCADE")),
    db.Column('mot_cle_id', db.Integer, db.ForeignKey('t_mots_cles.id_mot_cle', ondelete="CASCADE"))
)

class MotCle(db.Model):
    __tablename__ = 't_mots_cles'
    id_mot_cle = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String)  
    reponses = db.relationship('Reponse', secondary='cor_reponses_mots_cles', back_populates='mots_cles')

class Nomenclature(db.Model):
    __tablename__ = 't_nomenclatures'
    id_nomenclature = db.Column('id_nomenclature', db.Integer, primary_key=True)
    libelle = db.Column(db.String)
    value = db.Column(db.Integer)
    mnemonique = db.Column(db.String)
    sites = db.relationship('Site', secondary='cor_site_habitat', back_populates='habitats')
    acteurs_c = db.relationship('Acteur', secondary='cor_categorie_acteur', back_populates='categories')
    acteurs_p = db.relationship('Acteur', back_populates='profil', foreign_keys='Acteur.profil_cognitif_id')
    acteurs_se = db.relationship('Acteur', back_populates='statut_entretien', foreign_keys='Acteur.statut_entretien_id')
    questions = db.relationship('Question',  back_populates='theme')