import pytest
from models.models import db, Commune, Site, Acteur
from schemas.metier import CommuneSchema, SiteSchema, ActeurSchema


class TestPerformance:
    """Tests de performance"""
    
    def test_communes_response_time(self, client):
        """Test temps de réponse pour la récupération des communes"""
        import time
        
        start_time = time.time()
        response = client.get("/communes")
        end_time = time.time()
        
        assert response.status_code == 200
        # Vérifier que la réponse est rapide (moins de 2 secondes)
        assert (end_time - start_time) < 2.0

    def test_sites_response_time(self, client):
        """Test temps de réponse pour la récupération des sites"""
        import time
        
        start_time = time.time()
        response = client.get("/sites")
        end_time = time.time()
        
        assert response.status_code == 200
        # Vérifier que la réponse est rapide (moins de 2 secondes)
        assert (end_time - start_time) < 2.0

    