from backend.services.base_service import BaseService
from backend.models.models import Commune
from backend.schemas.metier import CommuneSchema
from sqlalchemy.orm import defer
from backend.app import db
from werkzeug.exceptions import NotFound

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