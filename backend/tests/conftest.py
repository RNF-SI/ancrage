import sys, os
import pytest
from unittest.mock import patch
# 🔧 ajoute le dossier racine dans le PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models.models import db


@pytest.fixture
def app():
    with patch("pypnusershub.auth.auth_manager.AuthManager.init_app"):
        app = create_app()
        app.config.update({
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": app.config.get("SQLALCHEMY_DATABASE_URI")
    # base en mémoire pour tests
        })

        with app.app_context():
            yield app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()
