import pytest
from schemas.metier import CommuneSchema
from models.models import Commune

def test_commune_schema_generation():
    """Test simple de génération du code département"""
    # Créer un objet Commune mock
    commune = Commune()
    commune.insee_com = "21121"  # Fontaine-lès-Dijon
    
    schema = CommuneSchema()
    data = schema.dump(commune)
    
    assert "code_dpt" in data
    assert data["code_dpt"] == "21"  # Seulement le code département

def test_commune_schema_dom_tom():
    """Test pour les DOM-TOM"""
    commune = Commune()
    commune.insee_com = "97101"  # Guadeloupe
    
    schema = CommuneSchema()
    data = schema.dump(commune)
    
    assert "code_dpt" in data
    assert data["code_dpt"] == "97"  # Seulement le code département 