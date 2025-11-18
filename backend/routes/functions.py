from models.models import Acteur
from sqlalchemy.orm import selectinload

def checkCCG(id_acteur):
    # Charger avec eager loading pour éviter les requêtes N+1
    acteur = (
        Acteur.query
        .options(selectinload(Acteur.categories))
        .filter_by(id_acteur=id_acteur)
        .first()
    )
    isCCG = False
    for cat in acteur.categories:
        if cat.libelle == "Membres ou participants au CCG":
            isCCG = True
            break
    return isCCG