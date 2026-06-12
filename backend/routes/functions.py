from models.models import Acteur, Question, Nomenclature
from sqlalchemy.orm import selectinload, aliased
from sqlalchemy import or_

OPTIONAL_THEME_QUESTION_LIBELLE = "Changement climatique et biodiversité"


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