from backend.services.base_service import BaseService
from backend.models.models import Region
from backend.schemas.metier import RegionSchema
from backend.app import db
from werkzeug.exceptions import NotFound

class RegionService(BaseService):
    """Service pour gérer les régions"""
    
    def __init__(self):
        super().__init__(Region, RegionSchema, 'region')
    
    def get_by_id_simple(self, region_id):
        """Récupère une région par ID (sans slug)"""
        region = self.model.query.get(region_id)
        if not region:
            raise NotFound('Région non trouvée')
        return self.serialize(region)
    
    def update_simple(self, region_id, data):
        """Met à jour une région (sans slug)"""
        region = self.model.query.get(region_id)
        if not region:
            raise NotFound('Région non trouvée')
        
        # Mise à jour des champs
        if 'nom' in data:
            region.libelle = data['nom']
        if 'position_x' in data:
            region.mnemonique = data['position_x']
        
        db.session.commit()
        return self.serialize(region)
    
    def delete_simple(self, region_id):
        """Supprime une région (sans slug)"""
        region = self.model.query.get(region_id)
        if not region:
            raise NotFound('Région non trouvée')
        
        db.session.delete(region)
        db.session.commit()
        return {"success": "Suppression terminée"}
    
    def create_simple(self, data):
        """Crée une région"""
        region = self.model()
        
        if 'nom' in data:
            region.libelle = data['nom']
        if 'position_x' in data:
            region.mnemonique = data['position_x']
        
        db.session.add(region)
        db.session.commit()
        
        return self.serialize(region)
    
    def get_by_mnemonique(self, mnemonique):
        """Récupère les régions par mnémonique"""
        self.logger.info(f"📋 Récupération des régions avec mnémonique '{mnemonique}'")
        
        regions = self.model.query.filter_by(mnemonique=mnemonique).all()
        return self.serialize(regions, many=True)