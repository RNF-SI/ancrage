import pytest
from models.models import db, Site, Commune, Region, Departement, Acteur, Nomenclature
from schemas.metier import SiteSchema, CommuneSchema, RegionSchema, DepartementSchema, ActeurSchema, NomenclatureSchema
from flask import jsonify
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

        print("status:", response.status_code)
        print("data:", response.get_json())

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



