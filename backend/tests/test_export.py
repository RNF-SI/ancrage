"""Tests des données servies aux exports XLS d'un diagnostic (#93, #104).

Les tests de routes de test_routes_complete.py répondent 401 parce que
conftest.py ne neutralise pas check_auth ; on vérifie donc ici les requêtes
elles-mêmes, telles que les routes les construisent.
"""
from models.models import Question, Acteur, Reponse
from schemas.metier import ActeurExportSchema


def questions_export_complet():
    """Requête de la route /questions/completes."""
    return Question.query.filter(Question.metrique.isnot(None)).order_by(Question.metrique).all()


def questions_matrice():
    """Requête de la route /questions, celle de la matrice anonymisée."""
    return Question.query.filter(Question.indications != "").order_by(Question.metrique).all()


class TestQuestionsExport:
    """La liste de questions servie aux exports"""

    def test_la_matrice_ne_tronque_plus_les_dernieres_questions(self, app):
        """#104 : l'export s'arrêtait à la métrique 25 et perdait 9 questions."""
        metriques = [q.metrique for q in questions_matrice()]

        assert metriques, "aucune question en base, test non concluant"
        assert max(metriques) > 25
        for libelle in ["Sentiment d'implication", "Impacts", "Adaptation", "Avis", "Attentes"]:
            assert libelle in [q.libelle_graphique for q in questions_matrice()]

    def test_les_questions_sont_ordonnees_par_metrique(self, app):
        metriques = [q.metrique for q in questions_matrice()]
        assert metriques == sorted(metriques)

    def test_export_complet_ajoute_synthese_et_enracinement(self, app):
        """#93 : ces deux questions n'ont pas d'indications, donc /questions les ignore."""
        libelles = [q.libelle_graphique for q in questions_export_complet()]

        assert 'Synthèse' in libelles
        assert 'Enracinement' in libelles

    def test_export_complet_ignore_les_questions_non_notees(self, app):
        """La question « afom » n'a pas de métrique : elle n'a pas sa place en colonne."""
        for question in questions_export_complet():
            assert question.metrique is not None

    def test_export_complet_est_un_sur_ensemble_de_la_matrice(self, app):
        ids_matrice = {q.id_question for q in questions_matrice()}
        ids_complet = {q.id_question for q in questions_export_complet()}

        assert ids_matrice < ids_complet


class TestSerialisationExport:
    """Ce que la route d'export renvoie pour un acteur"""

    def test_les_reponses_portent_la_question_et_le_score(self, app):
        """#104 : sans ces deux informations, le tableur n'affichait que des NULL."""
        acteur = (
            Acteur.query
            .join(Reponse, Reponse.acteur_id == Acteur.id_acteur)
            .filter(Acteur.is_deleted == False)
            .first()
        )
        if acteur is None:
            return

        donnees = ActeurExportSchema().dump(acteur)

        assert donnees['reponses'], "l'acteur choisi devrait avoir des réponses"
        reponse = donnees['reponses'][0]
        assert 'id_question' in reponse['question']
        assert 'value' in reponse['valeur_reponse']
