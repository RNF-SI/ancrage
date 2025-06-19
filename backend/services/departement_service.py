from backend.services.base_service import BaseService
from backend.models.models import Departement
from backend.schemas.metier import DepartementSchema
from backend.app import db
from backend.error_handlers import NotFound

class DepartementService(BaseService):
    """Service pour gérer les départements"""
    
    def __init__(self):
        super().__init__(Departement, DepartementSchema, 'departement')
    
    def get_by_id_simple(self, departement_id):
        """Récupère un département par ID"""
        departement = self.model.query.get(departement_id)
        if not departement:
            raise NotFound('Département non trouvé')
        return self.serialize(departement)
    
    def update_simple(self, departement_id, data):
        """Met à jour un département"""
        departement = self.model.query.get(departement_id)
        if not departement:
            raise NotFound('Département non trouvé')
        
        if 'nom' in data:
            departement.libelle = data['nom']
        if 'position_x' in data:
            departement.mnemonique = data['position_x']
        
        db.session.commit()
        return self.serialize(departement)
    
    def delete_simple(self, departement_id):
        """Supprime un département"""
        departement = self.model.query.get(departement_id)
        if not departement:
            raise NotFound('Département non trouvé')
        
        db.session.delete(departement)
        db.session.commit()
        return {"success": "Suppression terminée"}
    
    def create_simple(self, data):
        """Crée un département"""
        departement = self.model()
        
        if 'nom' in data:
            departement.libelle = data['nom']
        if 'position_x' in data:
            departement.mnemonique = data['position_x']
        
        db.session.add(departement)
        db.session.commit()
        
        return self.serialize(departement)