from backend.services.base_service import BaseService
from backend.models.models import Site, Departement, Diagnostic
from backend.schemas.metier import SiteSchema
from sqlalchemy.orm import joinedload
from backend.app import db

class SiteService(BaseService):
    """Service pour gérer les sites"""
    
    def __init__(self):
        super().__init__(Site, SiteSchema, 'site')
    
    def update_with_relations(self, site_id, slug, data):
        """Met à jour un site avec ses relations"""
        site = self.get_by_id_and_slug(site_id, slug)
        
        # Extraire les relations et champs spéciaux
        departements_data = data.pop('departements', None)
        type_id = data.pop('type_id', None)
        
        # Gestion des champs spéciaux
        if 'position_x' in data:
            site.position_x = data.pop('position_x')
        if 'position_y' in data:
            site.position_y = data.pop('position_y')
        
        # Type de site
        if type_id is not None:
            site.type_id = type_id
        
        # Mise à jour des champs simples via BaseService
        result = super().update(site_id, slug, data)
        
        # Mise à jour des départements
        if departements_data is not None:
            self.update_many_to_many(site, 'departements', departements_data, Departement, 'id_departement')
            
        db.session.commit()
        
        # Recharger avec les relations
        return self.get_with_relations(site_id, site.slug)
    
    def get_with_relations(self, site_id, slug):
        """Récupère un site avec ses relations"""
        site = self.get_by_id_and_slug(site_id, slug)
        
        # Charger les relations
        site = Site.query.options(
            joinedload(Site.departements),
            joinedload(Site.diagnostics)
        ).filter_by(id_site=site_id).first()
        
        return self.serialize(site)
    
    def get_by_user(self, user_id):
        """Récupère les sites créés par un utilisateur avec leurs diagnostics"""
        self.logger.info(f"📋 Récupération des sites de l'utilisateur {user_id}")
        
        sites = Site.query.options(
            joinedload(Site.diagnostics)
        ).filter_by(created_by=user_id).all()
        
        # Compter les diagnostics par site
        result = []
        for site in sites:
            site_data = self.serialize(site)
            site_data['diagnostics_count'] = len(site.diagnostics)
            result.append(site_data)
            
        return result
    
    def get_by_creator(self, created_by):
        """Récupère les sites d'un utilisateur créateur via les diagnostics (logique originale)"""
        from sqlalchemy.orm import contains_eager
        
        self.logger.info(f"📋 Récupération des sites créés par : {created_by}")
        
        sites = (
            db.session.query(Site)
            .join(Site.diagnostics)
            .filter(Diagnostic.created_by == created_by)
            .options(contains_eager(Site.diagnostics))
            .all()
        )
        
        return self.serialize(sites, many=True)