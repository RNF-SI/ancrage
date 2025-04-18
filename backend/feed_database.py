from app import create_app
from models.models import SiteHabitat, db,Acteur, CategoriesActeurs, Commune, Departement, Diagnostic, DiagnosticsSites, MotCle, Nomenclature, Region, Reponse, ReponseMotCle, Site, SiteDepartement
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
    for i in range(1, 4):
        t = Nomenclature(
            libelle=f"Type {i}",
            value=random.randint(1, 99),
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
            statut_entretien_id=random.choice(nomenclatures).id_nomenclature
        )
        db.session.add(d)
        diagnostics.append(d)
    db.session.commit()
    # ---------------------
# Sites, régions, départements
# ---------------------
    site_data = [
        ("Paris", 48.8566, 2.3522, "Paris", "75", "Île-de-France", "11"),
        ("Lyon", 45.7640, 4.8357, "Rhône", "69", "Auvergne-Rhône-Alpes", "84"),
        ("Marseille", 43.2965, 5.3698, "Bouches-du-Rhône", "13", "Provence-Alpes-Côte d’Azur", "93"),
        ("Bordeaux", 44.8378, -0.5792, "Gironde", "33", "Nouvelle-Aquitaine", "75"),
        ("Lille", 50.6292, 3.0573, "Nord", "59", "Hauts-de-France", "32"),
        ("Strasbourg", 48.5734, 7.7521, "Bas-Rhin", "67", "Grand Est", "44"),
        ("Nantes", 47.2184, -1.5536, "Loire-Atlantique", "44", "Pays de la Loire", "52"),
        ("Grenoble", 45.1885, 5.7245, "Isère", "38", "Auvergne-Rhône-Alpes", "84"),
        ("Toulouse", 43.6047, 1.4442, "Haute-Garonne", "31", "Occitanie", "76"),
        ("Rouen", 49.4431, 1.0993, "Seine-Maritime", "76", "Normandie", "28"),
    ]
    regions_dict = {
       
    }
    for data in site_data:
        nom_reg = data[5]
        code_reg = data[6]
        if code_reg not in regions_dict:
            region = Region(
                id_region=len(regions_dict) + 1,
                id_reg=f"REG{len(regions_dict)+1}",
                nom_reg=nom_reg,
                insee_reg=code_reg
            )
            db.session.add(region)
            regions_dict[code_reg] = region
    db.session.commit()
    for i, (nom_site, lat, lon, nom_dep, code_dep, nom_reg, code_reg) in enumerate(site_data):
       

        departement = Departement(
            id_departement=i + 1,
            id_dep=code_dep,
            nom_dep=nom_dep,

            insee_dep=code_dep,
            insee_reg=code_reg
        )
        db.session.add(departement)

        site = Site(
            nom=nom_site,
            position_x=str(lon),
            position_y=str(lat),
            type_id=random.choice(types_sites).id_nomenclature,
            created_at=datetime.now(),
            modified_at=datetime.now(),
            created_by=1,
            modified_by=1
        )
        db.session.add(site)
        db.session.flush()  # pour récupérer site.id_site

        # Lien site <-> département
        sd = SiteDepartement(site_id=site.id_site, departement_id=departement.id_departement)
        db.session.add(sd)

        # Lien site <-> diagnostic
        diag = random.choice(diagnostics)
        link = DiagnosticsSites(site_id=site.id_site, diagnostic_id=diag.id_diagnostic)
        db.session.add(link)

        # Lien site <-> habitat (1 à 2 habitats aléatoires par site)
        for habitat in random.sample(habitats, k=random.randint(1, 2)):
            site_habitat = SiteHabitat(site_id=site.id_site, habitat_id=habitat.id_nomenclature)
            db.session.add(site_habitat)

    db.session.commit()


    # ---------------------
    # Liens Sites-Diagnostics
    # ---------------------
    for i in range(10):
        
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
