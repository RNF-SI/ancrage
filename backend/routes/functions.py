from models.models import Acteur, Question, Nomenclature
from sqlalchemy.orm import selectinload, aliased
from sqlalchemy import or_

OPTIONAL_THEME_QUESTION_LIBELLE = "Changement climatique et biodiversité"

# Libellé de la réponse « pas de position tranchée ». Sa nomenclature porte la
# valeur 3, qui est aussi un score réel : la compter dans les agrégations
# revient à attribuer un score moyen à quelqu'un qui n'en a pas reçu.
REPONSE_NON_CLAIRE_LIBELLE = "N'a pas exprimé de réponse claire"


def filtres_reponses_scorantes(valeur_reponse, afficher_reponse_non_claire=False):
    """Filtres SQL limitant une agrégation aux réponses réellement notées.

    Les scores exploitables vont de 1 à 5. Une valeur nulle ou 0 signale une
    absence de score attribué : c'est le cas de « Réponse avec commentaire »
    (ex-« Sans réponse »), posée automatiquement lorsque l'enquêteur saisit un
    commentaire sans choisir de note. La filtrer sur la valeur plutôt que sur le
    libellé évite de dépendre des renommages de la nomenclature.

    `valeur_reponse` est l'alias de Nomenclature joint sur Reponse.valeur_reponse_id.
    """
    filtres = [valeur_reponse.value.isnot(None), valeur_reponse.value > 0]

    if not afficher_reponse_non_claire:
        filtres.append(valeur_reponse.libelle != REPONSE_NON_CLAIRE_LIBELLE)

    return filtres


def normaliser_nom_mot_cle(nom):
    """Forme canonique d'un mot-clé (espaces compactés, casse ignorée).

    Sert à reconnaître qu'« Accès à une barque » et « accès à  une barque »
    désignent le même mot-clé, et donc à ne pas créer de doublon.
    """
    return " ".join((nom or "").split()).casefold()


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


def required_questions_query(is_ccg: bool):
    """Questions prises en compte pour le statut d'entretien (hors facultatives)."""
    Theme = aliased(Nomenclature)
    ThemeQuestion = aliased(Nomenclature)

    query = Question.query.outerjoin(
        ThemeQuestion, Question.theme_question_id == ThemeQuestion.id_nomenclature
    )

    if not is_ccg:
        query = query.join(Theme, Question.theme_id == Theme.id_nomenclature)
        query = query.filter(Theme.libelle != "CCG")

    return query.filter(
        or_(
            Question.theme_question_id.is_(None),
            ThemeQuestion.libelle != OPTIONAL_THEME_QUESTION_LIBELLE,
        )
    )