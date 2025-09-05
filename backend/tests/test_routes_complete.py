import io
from models.models import Site, Commune, Region, Departement, Acteur, Nomenclature, Document, Diagnostic, Reponse
from schemas.metier import SiteSchema, ActeurSchema, DiagnosticLiteSchema
from unittest.mock import patch, MagicMock
import json

    
class TestSites:
    """Tests pour les routes des sites"""
    
    def test_site(self, client):
        # Récupérer un site de la base
        site = Site.query.first()
        schema = SiteSchema()
        site_data = schema.dump(site)
        site_data.pop("id_site", None)
        site_data.pop("slug", None)
        # Faire la requête POST avec les données JSON
        response = client.post("/site/", json=site_data)
        assert response.status_code == 200

        new_site = response.get_json()
        site_id = new_site["id_site"]
        slug = new_site["slug"]

        # --- PUT ---
        site_data["nom"] = "Nom du site modifié"
        response = client.put(f"/site/{site_id}/{slug}", json=site_data)
        assert response.status_code == 200

        updated_site = response.get_json()
        assert updated_site["nom"] == "Nom du site modifié"

        # --- DELETE ---
        response = client.delete(f"/site/{site_id}/{slug}")
        assert response.status_code == 204

        # Vérifier que le site a bien été supprimé en base
        deleted = Site.query.get(site_id)
        assert deleted is None


class TestCommunes:
    """Tests pour les routes des communes"""
    
    def test_get_all_communes(self, client):
        """Test récupération de toutes les communes"""
        response = client.get("/communes")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        # Vérifier que les codes département sont présents
        if data:
            assert "code_dpt" in data[0]

    def test_get_commune_by_id(self, client):
        """Test récupération d'une commune par ID"""
        commune = Commune.query.first()
        if commune:
            response = client.get(f"/commune/{commune.id_commune}")
            assert response.status_code == 200
            data = response.get_json()
            assert data["id_commune"] == commune.id_commune

    def test_get_commune_not_found(self, client):
        """Test récupération d'une commune inexistante"""
        response = client.get("/commune/999999")
        assert response.status_code == 404

    

class TestRegions:
    """Tests pour les routes des régions"""
    
    def test_get_all_regions(self, client):
        """Test récupération de toutes les régions"""
        response = client.get("/regions")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_get_region_by_id(self, client):
        """Test récupération d'une région par ID"""
        region = Region.query.first()
        if region:
            response = client.get(f"/region/{region.id_region}")
            assert response.status_code == 200
            data = response.get_json()
            assert data["id_region"] == region.id_region

    def test_get_region_not_found(self, client):
        """Test récupération d'une région inexistante"""
        response = client.get("/region/999999")
        assert response.status_code == 404


class TestDepartements:
    """Tests pour les routes des départements"""
    
    def test_get_all_departements(self, client):
        """Test récupération de tous les départements"""
        response = client.get("/departements")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_get_departement_by_id(self, client):
        """Test récupération d'un département par ID"""
        departement = Departement.query.first()
        if departement:
            response = client.get(f"/departement/{departement.id_departement}")
            assert response.status_code == 200
            data = response.get_json()
            assert data["id_departement"] == departement.id_departement

    def test_get_departement_not_found(self, client):
        """Test récupération d'un département inexistant"""
        response = client.get("/departement/999999")
        assert response.status_code == 404


class TestActeurs:
    """Tests pour les routes des acteurs"""
    
    def test_get_acteur_not_found(self, client):
        """Test récupération d'un acteur inexistant"""
        response = client.get("/acteur/99999/invalid-slug")
        assert response.status_code == 404

    def test_get_acteur_invalid_slug(self, client):
        """Test récupération d'un acteur avec slug invalide"""
        acteur = Acteur.query.first()
        if acteur:
            response = client.get(f"/acteur/{acteur.id_acteur}/invalid-slug")
            assert response.status_code == 400

    def test_get_acteur_by_id(self, client):
        """Test récupération d'un acteur par ID"""
        acteur = Acteur.query.first()
        if acteur:
            response = client.get(f"/acteur/{acteur.id_acteur}/{acteur.slug}")
            assert response.status_code == 200
            data = response.get_json()
            assert data["id_acteur"] == acteur.id_acteur

            response = client.post("/acteur/", json=data)
            assert response.status_code == 200
            data = response.get_json()
            assert data["nom"] == acteur.nom

            data["nom"] = "Test"
            response = client.put(f"/acteur/{acteur.id_acteur}/{acteur.slug}", json=data)
            assert response.status_code == 200
            data = response.get_json()
            assert data["nom"] == "Test"

            response = client.delete(f"/acteur/{acteur.id_acteur}/{acteur.slug}")
            assert response.status_code == 204

class TestDiagnostic:
    """Tests pour les routes des diagnostics"""

    def test_debug(self, client):
        print("Diagnostics :", Diagnostic.query.count())
        print("Acteurs :", Acteur.query.count())
        print("Join diag-acteurs :", Diagnostic.query.join(Diagnostic.acteurs).count())

        diagnostic = Diagnostic.query.join(Diagnostic.acteurs).first()
        assert diagnostic is not None, "Pas de diagnostic avec acteur trouvé dans la session SQLAlchemy"
    
    def test_get_diagnostic_not_found(self, client):
        """Test récupération d'un acteur inexistant"""
        response = client.get("/diagnostic/99999/invalid-slug")
        assert response.status_code == 404

    def test_get_diagnostic_invalid_slug(self, client):
        """Test récupération d'un acteur avec slug invalide"""
        diag = Diagnostic.query.first()
        if diag:
            response = client.get(f"/diagnostic/{diag.id_diagnostic}/invalid-slug")
            assert response.status_code == 400

    def test_get_diagnostic_by_id(self, client):
        """Test récupération d'un acteur par ID"""
        diagnostic = Diagnostic.query.join(Diagnostic.acteurs).first()
        if diagnostic:
            response = client.get(f"/diagnostic/{diagnostic.id_diagnostic}/{diagnostic.slug}")
            assert response.status_code == 200
            data = response.get_json()
            assert data["id_diagnostic"] == diagnostic.id_diagnostic

            response = client.post("/diagnostic", json=data)
            assert response.status_code == 200
            data = response.get_json()
            assert data["nom"] == diagnostic.nom

            data["nom"] = "Test"
            response = client.put(f"/diagnostic/{diagnostic.id_diagnostic}/{diagnostic.slug}", json=data)
            assert response.status_code == 200
            data = response.get_json()
            assert data["nom"] == "Test"

            documents = [
                {"nom": "fichier1.txt", "diagnostic": {"id_diagnostic": diagnostic.id_diagnostic}},
                {"nom": "fichier2.txt", "diagnostic": {"id_diagnostic": diagnostic.id_diagnostic}},
            ]

            # ⚠️ Simuler deux fichiers en mémoire correctement
            data = {
                "documents": json.dumps(documents),
                "files": [
                    (io.BytesIO(b"contenu fichier 1"), "fichier1.txt"),
                    (io.BytesIO(b"contenu fichier 2"), "fichier2.txt"),
                ],
            }

            response = client.post(
                "/diagnostic/upload",
                data=data,
                content_type="multipart/form-data",
            )

            assert response.status_code == 200, f"Échec upload : {response.data}"
            resp_json = response.get_json()
            assert resp_json is not None
            assert resp_json["id_diagnostic"] == diagnostic.id_diagnostic

            # Vérification du téléchargement
            response = client.get("/diagnostic/uploads/fichier1.txt")
            assert response.status_code == 200

            # Vérification suppression
            document = Document.query.filter_by(nom="fichier1.txt").first()
            assert document is not None, "Le document n'a pas été trouvé en base"

            response = client.delete(f"/diagnostic/document/delete/{document.id_document}")
            assert response.status_code in (200,204), f"Suppression doc échouée ({response.status_code}) : {response.data}"

            # Suppression du diagnostic
            response = client.delete(f"/diagnostic/{diagnostic.id_diagnostic}/{diagnostic.slug}")
            assert response.status_code == 204, f"Échec suppression diag : {response.data}"


class TestNomenclatures:
    """Tests pour les routes des nomenclatures"""
    
    def test_get_all_nomenclatures(self, client):
        """Test récupération de toutes les nomenclatures"""
        response = client.get("/nomenclatures")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_get_nomenclature_by_id(self, client):
        """Test récupération d'une nomenclature par ID"""
        nomenclature = Nomenclature.query.first()
        if nomenclature:
            response = client.get(f"/nomenclature/{nomenclature.id_nomenclature}")
            assert response.status_code == 200
            data = response.get_json()
            assert data["id_nomenclature"] == nomenclature.id_nomenclature

    def test_get_nomenclature_not_found(self, client):
        """Test récupération d'une nomenclature inexistante"""
        response = client.get("/nomenclature/99999")
        assert response.status_code == 404

    def test_get_nomenclatures_by_type(self, client):
        """Test récupération des nomenclatures par type"""
        response = client.get("/nomenclatures/profil")
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

class TestMail:
    def test_send_mail_success(self,client):
        payload = {
            "token": "fake-token",
            "expediteur": "user@test.com",
            "nom": "Jean Dupont",
            "objet": "Test objet",
            "message": "Ceci est un message test"
        }

        # Mock `requests.post` pour reCAPTCHA
        mock_response = MagicMock()
        mock_response.json.return_value = {"success": True, "score": 0.9}

        with patch("routes.mail.requests.post", return_value=mock_response) as mock_post:
            with patch("configs.mail_config.mail.send") as mock_send:
                response = client.post("/mail/send", json=payload)

        assert response.status_code == 200
        assert response.get_json()["message"] == "Email envoyé avec succès"

        # Vérifie que reCAPTCHA a été appelé
        mock_post.assert_called_once()

        # Vérifie que le mail a été envoyé
        mock_send.assert_called_once()

class TestQuestions:
    def test_question_libelle(self,client):
        response = client.get('/question/Atouts%20-%20Faiblesses%20-%20Opportunités%20-%20Menaces')
        assert response.status_code == 200

    def test_all_questions(self,client):
        response = client.get('/questions')
        assert response.status_code == 200

    def test_question_without_libelle(self,client):
        response = client.get('question/')
        assert response.status_code == 404

    def test_question_with_wrong_label(self,client):
        response = client.get('/question/wrong')
        assert response.status_code == 404

class TestReponse:
    def test_entretien(self,client):
        diagnostic = Diagnostic.query.join(Diagnostic.acteurs).first()
        reponse = client.get('/communes')
        communes = reponse.get_json()
        reponse = client.get('/nomenclatures/profil')
        profils = reponse.get_json()
        
        if not diagnostic.acteurs:
            acteur_data = {
                "nom": "Nom",
                "prenom": "Prénom",
                "commune": communes[0],
                "profil_cognitif": profils[0],
                "fonction": "fonction",
                "telephone":"05 06 07 08 09"
            }
        else:    
            acteur = diagnostic.acteurs[0]
            schema = ActeurSchema()
            acteur_data = schema.dump(acteur)
            acteur_data.pop("id_acteur", None)
            acteur_data.pop("slug", None)

        response = client.post('/acteur/',json=acteur_data)
        nouvel_acteur = response.get_json()
        diagnostic.acteurs.append(Acteur.query.get(nouvel_acteur["id_acteur"]))
        schema = DiagnosticLiteSchema()
        diagnostic_data = schema.dump(diagnostic)
        response = client.put(
            f"/diagnostic/{diagnostic.id_diagnostic}/{diagnostic.slug}",
            json=diagnostic_data
        )
        response = client.put(f"/diagnostic/{diagnostic.id_diagnostic}/{diagnostic.slug}",json=diagnostic_data)
        diagnostic_maj = response.get_json()
        response = client.get(f'/nomenclatures/thème_question/{nouvel_acteur['id_acteur']}')
        themes = response.get_json()
        # Boucle sur toutes les questions
        for t in themes:
            for q in t.get("questions", []):
                # ⚠️ Ignorer les questions "Sans indicateur"
                if q.get("indications") == "Sans indicateur":
                    continue

                # Choisir une nomenclature possible comme valeur de réponse
                choix = q.get("choixReponses", [])
                if not choix:
                    continue
                valeur = choix[0]  # ici on prend arbitrairement le premier choix

                # Préparer l'objet réponse
                reponse_obj = {
                    "acteur": {"id_acteur": nouvel_acteur["id_acteur"]},
                    "question": {"id_question": q["id_question"]},
                    "valeur_reponse": {"id_nomenclature": valeur["id_nomenclature"]},
                    "commentaires": "Réponse test auto"
                }

                # Appel de l'API pour insérer la réponse
                client.post("/reponse/objet", json=reponse_obj)

        # Vérification : toutes les réponses sauf "Sans indicateur" doivent être présentes
        reponses = Reponse.query.filter_by(acteur_id=nouvel_acteur["id_acteur"]).all()
        assert all(r.question.indications != "Sans indicateur" for r in reponses)
        assert len(reponses) > 0

        response = client.delete(f'/acteur/{nouvel_acteur['id_acteur']}/{nouvel_acteur['slug']}')


class TestErrorHandling:
    """Tests pour la gestion d'erreurs"""
    
    def test_invalid_json(self, client):
        """Test avec JSON invalide"""
        response = client.post("/site/", 
                              data="invalid json",
                              content_type="application/json")
        assert response.status_code == 400

    def test_missing_required_fields(self, client):
        """Test avec champs requis manquants"""
        response = client.post("/site/", json={})
        # Le statut peut varier selon la validation
        assert response.status_code in [400, 422, 500]

    def test_invalid_method(self, client):
        """Test avec méthode HTTP invalide"""
        response = client.patch("/sites")
        assert response.status_code == 405



