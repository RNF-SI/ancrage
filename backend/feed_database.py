from app import create_app
from models.models import db,Nomenclature
from datetime import datetime, timedelta
import random
import string

app=create_app()
def random_string(length=10):
    return ''.join(random.choices(string.ascii_letters, k=length))

def random_date(start_days=0, end_days=100):
    return datetime.now() - timedelta(days=random.randint(start_days, end_days))

with app.app_context():
    # TRUNCATE ciblé sans toucher à Region, Departement, Commune
    tables_to_truncate = [
        "t_nomenclatures",
        "t_diagnostics",
        "t_sites",
        "t_acteurs",
        "t_questions",
        "t_reponses",
        "t_mots_cles",
        "cor_reponses_mots_cles",
        "cor_site_departement",
        "cor_sites_diagnostics",
        "cor_site_habitat",
        "cor_categorie_acteur"
    ]

    for table in tables_to_truncate:
        db.session.execute(f'TRUNCATE {table} RESTART IDENTITY CASCADE')
    db.session.commit()

    # ---------------------
    # Nomenclatures
    # ---------------------
    nomenclatures = []

    # Ajout de 3 habitats (mnemonique = 'habitats')
    """   habitats = []
    for nom in ['Forêt feuillue', 'Prairie humide', 'Landes atlantiques']:
        h = Nomenclature(
            libelle=nom,
            value=random.randint(100, 200),
            mnemonique='habitats'
        )
        db.session.add(h)
        habitats.append(h) """

    # Ajout de 3 types de site (mnemonique = 'statut')
    types_sites = []
    types_labels = [
        "Réserve naturelle régionale",
        "Réserve naturelle nationale",
        "Réserve naturelle corse",
        "Parc Naturel National",
        "Parc Naturel Régional",
        "Espace CEN",
        "Espace Conservatoire du littoral",
        "Site Natural 2000",
        "Réserve de Chasse et de Faune Sauvage",
        "Espace Naturel Sensible",
        "Parc Naturel Marin"
    ]
    for i, lib in enumerate(types_labels):
        t = Nomenclature(
            libelle=lib,
            value=i,
            mnemonique='statut'
        )
        db.session.add(t)
        types_sites.append(t)

    categories = []
    profils = []
    statuts_entretien = []
    categorie_labels = [
        "Animation, pédagogie, tourisme et sensibilisation",
        "Partenaires, gestionnaires et techniciens",
        "Riverains, élus et usagers locaux",
        "Acteurs économiques",
        "Membres ou participants au CCG"
    ]

    cat_short_labels = [
        "Animation",
        "Partenaires",
        "Riverains",
        "Economie",
        "CCG"
    ]

    profils_labels = [
        "Fédérateur",
        "Territorial désintéressé",
        "Territorial intéressé",
        "Contraint",
        "Environnemental amateur ou spécialiste"
    ]
    

    etats_labels = [
        "Réalisé",
        "Reporté",
        "En cours",
        "Annulé",
        "Programmé",
        "Rétracté"
    ]

    categories_AFOM = [
        "Atouts",
        "Faiblesses",
        "Opportunités",
        "Menaces",
        "Non classés"
    ]

    themes_questions = [
        "Le site",
        "Les sources d'information",
        "La fréquence de visite",
        "Les actions mises en place",
        "L'organisme gestionnaire du site",
        "Les effets liés à l'existence du site",
        "La nature des liens",
        "Spécifique à l'instance de gouvernance",
        "Changement climatique et biodiversité",
        "Conclusion",

    ]

    for i, lib in enumerate(themes_questions):
        ca = Nomenclature(
            libelle=lib,
            value=i,
            mnemonique="thème_question"
        )
        db.session.add(ca)
        profils.append(ca)    


    for i, (lib, lib2) in enumerate(zip(categorie_labels, cat_short_labels)):
        c = Nomenclature(
            libelle=lib,
            value=i,
            mnemonique="categorie",
            libelle_court=lib2
        )
        db.session.add(c)
        categories.append(c)

    for i, lib in enumerate(categories_AFOM):
        ca = Nomenclature(
            libelle=lib,
            value=i,
            mnemonique="AFOM"
        )
        db.session.add(ca)
        profils.append(ca)    

    for i, lib in enumerate(profils_labels):
        p = Nomenclature(
            libelle=lib,
            value=i,
            mnemonique="profil"
        )
        db.session.add(p)
        profils.append(p)    

    for i, lib in enumerate(etats_labels):
        e = Nomenclature(
            libelle=lib,
            value=i,
            mnemonique="statut_entretien"
        )
        db.session.add(e)
        statuts_entretien.append(e)    


    db.session.commit()

    print("✅ Données de test créées avec succès.")
