from app import create_app
from models.models import db,Acteur, CategoriesActeurs, Commune, Departement, Diagnostic, DiagnosticsSites, MotCle, Nomenclature, Region, Reponse, ReponseMotCle, Site, SiteDepartement
from datetime import datetime, timedelta
import random
import string

app=create_app()
def random_string(length=10):
    return ''.join(random.choices(string.ascii_letters, k=length))

def random_date(start_days=0, end_days=100):
    return datetime.now() - timedelta(days=random.randint(start_days, end_days))

with app.app_context():
    db.drop_all()
    db.create_all()

    # ---------------------
    # Nomenclatures
    # ---------------------
    nomenclatures = []
    for i in range(10):
        n = Nomenclature(
            label=f"Nomenclature {i}",
            value=i,
            mnemonique=random_string(5)
        )
        db.session.add(n)
        nomenclatures.append(n)
    db.session.commit()

    # ---------------------
    # Régions (réelles)
    # ---------------------
    regions_data = [
        {"nom": "Auvergne-Rhône-Alpes", "insee": "84"},
        {"nom": "Bourgogne-Franche-Comté", "insee": "27"},
        {"nom": "Bretagne", "insee": "53"},
        {"nom": "Centre-Val de Loire", "insee": "24"},
        {"nom": "Corse", "insee": "94"},
        {"nom": "Grand Est", "insee": "44"},
        {"nom": "Hauts-de-France", "insee": "32"},
        {"nom": "Île-de-France", "insee": "11"},
        {"nom": "Normandie", "insee": "28"},
        {"nom": "Nouvelle-Aquitaine", "insee": "75"},
        {"nom": "Occitanie", "insee": "76"},
        {"nom": "Pays de la Loire", "insee": "52"},
        {"nom": "Provence-Alpes-Côte d’Azur", "insee": "93"},
        {"nom": "Guadeloupe", "insee": "01"},
        {"nom": "Martinique", "insee": "02"},
        {"nom": "Guyane", "insee": "03"},
        {"nom": "La Réunion", "insee": "04"},
        {"nom": "Mayotte", "insee": "06"}
    ]

    regions = []
    for i, reg in enumerate(regions_data):
        r = Region(
            id_region=i + 1,
            id_reg=f"REG{i+1}",
            nom_reg=reg["nom"],
            nom_reg_m=reg["nom"].upper(),
            insee_reg=reg["insee"]
        )
        db.session.add(r)
        regions.append(r)
    db.session.commit()

    # ---------------------
    # Départements (réels simplifiés)
    # ---------------------
    departements_data = [
        ("01", "Ain", "84"), ("02", "Aisne", "32"), ("03", "Allier", "84"), ("04", "Alpes-de-Haute-Provence", "93"),
        ("05", "Hautes-Alpes", "93"), ("06", "Alpes-Maritimes", "93"), ("07", "Ardèche", "84"), ("08", "Ardennes", "44"),
        ("09", "Ariège", "76"), ("10", "Aube", "44")
    ]

    departements = []
    for i, (code_dep, nom_dep, code_reg) in enumerate(departements_data):
        d = Departement(
            id_departement=i + 1,
            id_dep=code_dep,
            nom_dep=nom_dep,
            nom_dep_m=nom_dep.upper(),
            insee_dep=code_dep,
            insee_reg=code_reg
        )
        db.session.add(d)
        departements.append(d)
    db.session.commit()

    # ---------------------
    # Communes
    # ---------------------
    communes = []
    for i in range(10):
        c = Commune(
            id_commune=f"C{i}",
            nom_com=f"Commune {i}",
            nom_com_m=f"Commune M {i}",
            insee_com=f"{i:05}",
            statut="active",
            population=random.randint(100, 10000),
            insee_dep=random.choice(departements).insee_dep,
            insee_reg=random.choice(regions).insee_reg
        )
        db.session.add(c)
        communes.append(c)
    db.session.commit()

    # ---------------------
    # Sites
    # ---------------------
    sites = []
    for i in range(10):
        s = Site(
            nom=f"Site {i}",
            position_x=str(random.uniform(1, 100)),
            position_y=str(random.uniform(1, 100)),
            type_id=random.choice(nomenclatures).id_nomenclature,
            habitat_id=random.choice(nomenclatures).id_nomenclature,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            created_by=random.randint(1, 5),
            modified_by=random.randint(1, 5)
        )
        db.session.add(s)
        sites.append(s)
    db.session.commit()

    # ---------------------
    # Lien Sites-Départements (relation cor_site_departement)
    # ---------------------
    for site in sites:
        sd = SiteDepartement(
            site_id=site.id_site,
            departement_id=random.choice(departements).id_departement
        )
        db.session.add(sd)
    db.session.commit()

    # ---------------------
    # Diagnostics
    # ---------------------
    diagnostics = []
    for i in range(10):
        d = Diagnostic(
            nom=f"Diagnostic {i}",
            date_debut=random_date(),
            date_fin=random_date(0, 50),
            rapport="Lorem ipsum",
            created_at=datetime.now(),
            modified_at=datetime.now(),
            created_by=random.randint(1, 5),
            statut_entretien_id=random.choice(nomenclatures).id_nomenclature
        )
        db.session.add(d)
        diagnostics.append(d)
    db.session.commit()

    # ---------------------
    # Liens Sites-Diagnostics
    # ---------------------
    for i in range(10):
        link = DiagnosticsSites(
            site_id=random.choice(sites).id_site,
            diagnostic_id=random.choice(diagnostics).id_diagnostic
        )
        db.session.add(link)
    db.session.commit()

    # ---------------------
    # Acteurs
    # ---------------------
    acteurs = []
    for i in range(10):
        a = Acteur(
            nom=f"Nom {i}",
            prenom=f"Prénom {i}",
            fonction=random.randint(1, 3),
            telephone="0600000000",
            mail=f"user{i}@example.com",
            commune_id=random.choice(communes).id_commune,
            profil_cognitif_id=random.choice(nomenclatures).id_nomenclature,
            is_acteur_economique=bool(random.getrandbits(1)),
            structure=f"Structure {i}",
            diagnostic_id=random.choice(diagnostics).id_diagnostic,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            created_by=1,
            modified_by=1
        )
        db.session.add(a)
        acteurs.append(a)
    db.session.commit()

    # ---------------------
    # Catégories d'acteurs
    # ---------------------
    for i in range(10):
        c = CategoriesActeurs(
            acteur_id=random.choice(acteurs).id_acteur,
            categorie_acteur_id=random.choice(nomenclatures).id_nomenclature
        )
        db.session.add(c)
    db.session.commit()

    # ---------------------
    # Mots clés
    # ---------------------
    mots_cles = []
    for i in range(10):
        mc = MotCle(
            nom=f"MotClé {i}"
        )
        db.session.add(mc)
        mots_cles.append(mc)
    db.session.commit()

    # ---------------------
    # Réponses
    # ---------------------
    reponses = []
    for i in range(10):
        r = Reponse(
            mot_cle_id=random.choice(mots_cles).id_mot_cle,
            valeur_reponse_id=random.randint(1, 100)
        )
        db.session.add(r)
        reponses.append(r)
    db.session.commit()

    # ---------------------
    # Liens réponses <-> mots clés
    # ---------------------
    for i in range(10):
        rm = ReponseMotCle(
            mot_cle_id=random.choice(mots_cles).id_mot_cle,
            reponse_id=random.choice(reponses).id_reponse
        )
        db.session.add(rm)
    db.session.commit()

    print("✅ Données de test créées avec succès.")
