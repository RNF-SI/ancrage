from backend.services.base_service import BaseService
from backend.models.models import Commune
from backend.schemas.metier import CommuneSchema
from sqlalchemy.orm import defer
from backend.app import db
from backend.error_handlers import NotFound

class CommuneService(BaseService):
    """Service pour gérer les communes"""
    
    def __init__(self):
        super().__init__(Commune, CommuneSchema, 'commune')
    
    def get_all_optimized(self):
        """Récupère toutes les communes en excluant les champs volumineux"""
        self.logger.info("📋 Récupération optimisée de toutes les communes")
        
        # Exclure les champs volumineux pour optimiser les performances
        communes = Commune.query.options(
            defer(Commune.geom),
            defer(Commune.centroid),
            defer(Commune.bbox)
        ).all()
        
        # Mapper les champs pour l'API
        result = []
        for commune in communes:
            commune_data = {
                'id_commune': commune.id_commune,
                'code_insee': commune.code,
                'libelle': commune.nom,
                'mnemonique': commune.code
            }
            result.append(commune_data)
            
        return result
    
    def delete_commune(self, commune_id):
        """Supprime une commune"""
        self.logger.info(f"🗑️ Suppression de la commune {commune_id}")
        
        commune = Commune.query.get(commune_id)
        if not commune:
            raise NotFound(f"Commune {commune_id} non trouvée")
            
        db.session.delete(commune)
        db.session.commit()
        
        return {"message": "Commune supprimée avec succès"}
    
    def get_by_id_simple(self, commune_id):
        """Récupère une commune par ID"""
        commune = self.model.query.get(commune_id)
        if not commune:
            raise NotFound('Commune non trouvée')
        return self.serialize(commune)
    
    def update_simple(self, commune_id, data):
        """Met à jour une commune"""
        commune = self.model.query.get(commune_id)
        if not commune:
            raise NotFound('Commune non trouvée')
        
        if 'nom' in data:
            commune.libelle = data['nom']
        if 'position_x' in data:
            commune.mnemonique = data['position_x']
        
        db.session.commit()
        return self.serialize(commune)