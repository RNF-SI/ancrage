from models.models import Acteur

def checkCCG(id_acteur):
    acteur = Acteur.query.filter_by(id_acteur=id_acteur).first()
    isCCG = False
    for cat in acteur.categories:
        if cat.libelle == "Membres ou participants au CCG":
            isCCG = True
            break
    return isCCG