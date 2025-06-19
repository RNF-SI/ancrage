from backend.services.base_service import BaseService
from backend.models.models import Departement
from backend.schemas.metier import DepartementSchema

class DepartementService(BaseService):
    """Service pour gérer les départements"""
    
    def __init__(self):
        super().__init__(Departement, DepartementSchema, 'departement')