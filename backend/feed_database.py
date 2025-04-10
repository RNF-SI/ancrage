from app import db, app
from models.models import Region, Departement, Commune, Site, Diagnostic, Document, Entretien, Acteur, Reponse, ReponseMotCle, MotCle, Nomenclature
from geoalchemy2.shape import from_shape
from shapely.geometry import MultiPolygon, Polygon
from datetime import datetime, timedelta
import random
import string

def random_str(length=8):
    return ''.join(random.choices(string.ascii_letters, k=length))

def create_geom():
    coords = ((0, 0), (1, 0), (1, 1), (0, 1), (0, 0))
    poly = Polygon(coords)
    return from_shape(MultiPolygon([poly]), srid=4326)

with app.app_context():
    db.drop_all()
    db.create_all()

    # Regions
    regions = []
    for i in range(10):
        region = Region(
            geom=create_geom(),
            id_region=f"R{i}",
            nom_reg_m=f"Region_M_{i}",
            nom_reg=f"Region_{i}",
            insee_reg=f"{i:02}"
        )
        db.session.add(region)
        regions.append(region)

    # Départements
    departements = []
    for i in range(10):
        dep = Departement(
            geom=create_geom(),
            id_departement=f"D{i}",
            nom_dep_m=f"Dep_M_{i}",
            nom_dep=f"Dep_{i}",
            insee_dep=f"{i:03}",
            insee_reg=f"{i % 10:02}"
        )
        db.session.add(dep)
        departements.append(dep)

    # Communes
    communes = []
    for i in range(10):
        com = Commune(
            id_commune=f"C{i}",
            geom=create_geom(),
            nom_com=f"Commune_{i}",
            nom_com_m=f"Commune_M_{i}",
            insee_com=f"{i:05}",
            statut="Commune",
            population=random.randint(1000, 10000),
            insee_can="00000",
            insee_arr="00",
            insee_dep=f"{i % 10:03}",
            insee_reg=f"{i % 10:02}",
            code_epci="EPCI123"
        )
        db.session.add(com)
        communes.append(com)

    # Diagnostics & Sites
    sites = []
    diagnostics = []
    for i in range(10):

        diag = Diagnostic(
            nom=f"Diag_{i}",
            date_debut=datetime.utcnow() - timedelta(days=30),
            date_fin=datetime.utcnow(),
            rapport="Lorem ipsum",
            created_at=datetime.utcnow()
        )
        db.session.add(diag)
        diagnostics.append(diag)
    
        site = Site(
            nom=f"Site_{i}",
            diagnostics=[diag],
            position_x="1.0",
            position_y="1.0",
            type_id=1,
            habitat_id=1,
            created_at=datetime.utcnow()
        )
        db.session.add(site)
        sites.append(site)

    # Documents
    for i in range(10):
        db.session.add(Document(
            nom=f"Doc_{i}",
            diagnostic=diagnostics[i % len(diagnostics)]
        ))

    # Entretiens
    entretiens = []
    for i in range(10):
        ent = Entretien(
            date_entretien=datetime.utcnow(),
            contexte=1,
            statut_id=1,
            diagnostic=diagnostics[i % len(diagnostics)],
            created_at=datetime.utcnow()
        )
        db.session.add(ent)
        entretiens.append(ent)

    # Acteurs
    for i in range(10):
        act = Acteur(
            nom=f"Nom_{i}",
            prenom=f"Prenom_{i}",
            fonction=1,
            telephone="0600000000",
            mail=f"mail{i}@test.com",
            commune_id=communes[i % len(communes)].id_commune,
            profil_cognitif_id=1,
            is_acteur_economique=bool(i % 2),
            structure=f"Structure_{i}",
            diagnostic=diagnostics[i % len(diagnostics)],
            entretien=entretiens[i % len(entretiens)],
            created_at=datetime.utcnow()
        )
        db.session.add(act)

    # Mots clés
    mots_cles = []
    for i in range(10):
        mc = MotCle(nom=i)
        db.session.add(mc)
        mots_cles.append(mc)

    # Réponses
    reponses = []
    for i in range(10):
        rep = Reponse(
            mot_cle_id=mots_cles[i % 10].id_mot_cle,
            valeur_reponse_id=i,
            entretien=entretiens[i % len(entretiens)]
        )
        db.session.add(rep)
        reponses.append(rep)

    # ReponseMotCle
    for i in range(10):
        db.session.add(ReponseMotCle(
            mot_cle_id=mots_cles[i % 10].id_mot_cle,
            reponse=reponses[i % len(reponses)]
        ))

    # Nomenclatures
    for i in range(10):
        db.session.add(Nomenclature(
            label=f"Nomenclature_{i}",
            type_site_id=1,
            value=i,
            mnemonique=f"NOM_{i}",
            profil_cognitif_id=1,
            statut_entretien_id=1,
            habitat_id=1
        ))

    db.session.commit()
    print("✅ 10 objets de chaque modèle ont été insérés avec succès.")
