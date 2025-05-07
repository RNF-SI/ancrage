from app import create_app
from models.models import db,Acteur, Commune, Departement, Diagnostic, MotCle, Nomenclature, Region, Reponse, Site,site_departement,site_diagnostic,site_habitat,acteur_categorie,acteur_profil,acteur_question
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
        "cor_categorie_acteur",
        "cor_question_acteur"
    ]

    for table in tables_to_truncate:
        db.session.execute(f'TRUNCATE {table} RESTART IDENTITY CASCADE')
    db.session.commit()

    # ---------------------
    # Nomenclatures
    # ---------------------
    nomenclatures = []
    for i in range(10):
        n = Nomenclature(
            libelle=f"Nomenclature {i}",
            value=i,
            mnemonique=random_string(5)
        )
        db.session.add(n)
        nomenclatures.append(n)
    db.session.commit()

        # Ajout de 3 habitats (mnemonique = 'habitats')
    habitats = []
    for nom in ['Forêt feuillue', 'Prairie humide', 'Landes atlantiques']:
        h = Nomenclature(
            libelle=nom,
            value=random.randint(100, 200),
            mnemonique='habitats'
        )
        db.session.add(h)
        habitats.append(h)

    # Ajout de 3 types de site (mnemonique = 'statut')
    types_sites = []
    types_labels = [
        "Réserves naturelles",
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

    db.session.commit()

    # ---------------------
    # Diagnostics (créés avant les sites)
    # ---------------------
    diagnostics = []
    for i in range(10):
        d = Diagnostic(
            nom=f"Diagnostic {i}",
            date_debut=random_date(),
            date_fin=random_date(0, 50),
            is_read_only=False,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            created_by=random.randint(1, 5),
            
        )
        db.session.add(d)
        diagnostics.append(d)
    db.session.commit()
    # ---------------------
    # Sites, régions, départements
    # ---------------------
    site_data = [
        (48.8566, 2.3522),  # Paris
        (45.7640, 4.8357),  # Lyon
        (43.2965, 5.3698),  # Marseille
        (44.8378, -0.5792), # Bordeaux
        (50.6292, 3.0573),  # Lille
        (48.5734, 7.7521),  # Strasbourg
        (47.2184, -1.5536), # Nantes
        (45.1885, 5.7245),  # Grenoble
        (43.6047, 1.4442),  # Toulouse
        (49.4431, 1.0993),  # Rouen
    ]

    for idx, (lat, lon) in enumerate(site_data):
        # Création du site
        site = Site(
            nom=f"Site {idx}",
            position_x=str(lon),
            position_y=str(lat),
            type_id=random.choice(types_sites).id_nomenclature,  # type au hasard
            created_at=datetime.now(),
            modified_at=datetime.now(),
            created_by=1,
            modified_by=1
        )
        db.session.add(site)
        db.session.flush()  # pour récupérer site.id_site

    # Tirage aléatoire d'un département entre 1 et 13
        departement_id = random.randint(1, 13)
        db.session.execute(
            site_departement.insert().values(site_id=site.id_site, departement_id=departement_id)
        )

        # Liaison 1 ou 2 diagnostics
        diag_to_link = random.sample(diagnostics, k=random.randint(1, 2))
        for diag in diag_to_link:
            db.session.execute(
                site_diagnostic.insert().values(site_id=site.id_site, diagnostic_id=diag.id_diagnostic)
            )

    db.session.commit()

    categories = []
    profils = []
    statuts_entretien = []
    categorie_labels = [
        "Animation, pédagogie, tourisme et sensibilisation",
        "Partenaires, gestionnaires et techniciens",
        "Riverains, élus et usagers locaux",
        "Exploitants professionnels des ressources naturelles",
        "Membres du CCG"
    ]

    profils_labels = [
        "Fédérateur",
        "Territorial désintéressé",
        "Territorial intéressé",
        "Territorial désintéressé",
        "Contraint"
    ]

    etats_labels = [
        "Réalisé",
        "Reporté",
        "En cours",
        "Annulé",
        "Programmé"
    ]

    for i, lib in enumerate(categorie_labels):
        c = Nomenclature(
            libelle=lib,
            value=i,
            mnemonique="categorie"
        )
        db.session.add(c)
        categories.append(c)

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

    # ---------------------
    # Acteurs
    # ---------------------
    acteurs = []
    for i in range(20):
        # Choisir un diagnostic existant au hasard
        diagnostic = random.choice(diagnostics)

        acteur = Acteur(
            nom=f"Nom {i}",
            prenom=f"Prénom {i}",
            fonction=random.randint(1, 3),
            telephone="0600000000",
            mail=f"user{i}@example.com",
            profil_cognitif_id=random.choice(profils).id_nomenclature,
            is_acteur_economique=bool(random.getrandbits(1)),
            structure=f"Structure {i}",
            diagnostic_id=diagnostic.id_diagnostic,
            statut_entretien_id=random.choice(statuts_entretien).id_nomenclature,
            commune_id=random.randint(69931, 100000), 
            created_at=datetime.now(),
            modified_at=datetime.now(),
            created_by=1,
            modified_by=1
        )
        db.session.add(acteur)
        db.session.flush()
        acteurs.append(acteur)

        # Lier 1 à 3 catégories
        for cat in random.sample(categories, k=random.randint(1, 3)):
            db.session.execute(
                acteur_categorie.insert().values(
                    acteur_id=acteur.id_acteur,
                    categorie_id=cat.id_nomenclature
                )
            )

      

    db.session.commit()



    print("✅ Données de test créées avec succès.")
