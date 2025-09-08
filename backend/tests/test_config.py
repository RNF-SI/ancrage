import pytest
import os
from app import create_app
from models.models import db

class TestConfig:
    """Configuration pour les tests"""
    
    def test_app_config(self, client):
        """Test configuration de l'application"""
        app = client.application
        assert app.config['TESTING'] is True
        
    def test_database_config(self, client):
        """Test configuration de la base de données"""
        app = client.application
        # Vérifier que la base de données est configurée
        assert app.config.get('SQLALCHEMY_DATABASE_URI') is not None
        
    def test_logging_config(self, client):
        """Test configuration du logging"""
        app = client.application
        # Vérifier que le logging est configuré
        assert hasattr(app, 'logger') or app.debug is True 