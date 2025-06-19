from backend.services.base_service import BaseService
from backend.models.models import Nomenclature
from backend.schemas.metier import NomenclatureSchema
from backend.app import db
from backend.error_handlers import NotFound

class NomenclatureService(BaseService):
    """Service pour gérer les nomenclatures"""
    
    def __init__(self):
        super().__init__(Nomenclature, NomenclatureSchema, 'nomenclature')
    
    def get_by_type(self, type_nomenclature):
        """Récupère les nomenclatures d'un type spécifique"""
        self.logger.info(f"📋 Récupération des nomenclatures de type {type_nomenclature}")
        
        nomenclatures = Nomenclature.query.filter_by(type=type_nomenclature).all()
        return self.serialize(nomenclatures, many=True)
    
    def get_types(self):
        """Récupère tous les types de nomenclatures distincts"""
        self.logger.info("📋 Récupération des types de nomenclatures")
        
        types = db.session.query(Nomenclature.type).distinct().all()
        return [t[0] for t in types if t[0]]
    
    def get_by_id(self, nomenclature_id):
        """Récupère une nomenclature par ID"""
        nomenclature = self.model.query.get(nomenclature_id)
        if not nomenclature:
            raise NotFound('Nomenclature non trouvée')
        return self.serialize(nomenclature)
    
    def get_by_libelle(self, libelle):
        """Récupère une nomenclature par libellé"""
        nomenclature = self.model.query.filter_by(libelle=libelle).first()
        if not nomenclature:
            raise NotFound('Nomenclature non trouvée')
        return self.serialize(nomenclature)
    
    def get_by_mnemonique(self, mnemonique):
        """Récupère les nomenclatures par mnémonique"""
        self.logger.info(f"📋 Récupération des nomenclatures avec mnémonique '{mnemonique}'")
        
        nomenclatures = Nomenclature.query.filter_by(mnemonique=mnemonique).all()
        return self.serialize(nomenclatures, many=True)