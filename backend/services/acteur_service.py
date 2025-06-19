from backend.services.base_service import BaseService
from backend.models.models import Acteur, Nomenclature, Site
from backend.schemas.metier import ActeurSchema
from sqlalchemy.orm import joinedload
from sqlalchemy import and_, func
from backend.app import db
from backend.error_handlers import NotFound

class ActeurService(BaseService):
    """Service pour gérer les acteurs"""
    
    def __init__(self):
        super().__init__(Acteur, ActeurSchema, 'acteur')
    
    def update_with_relations(self, acteur_id, slug, data):
        """Met à jour un acteur avec ses relations (logique originale)"""
        acteur = self.get_by_id_and_slug(acteur_id, slug)
        
        # Mise à jour des champs de base
        acteur.nom = data['nom']
        acteur.prenom = data['prenom']
        acteur.fonction = data['fonction']
        acteur.telephone = data['telephone']
        acteur.mail = data['mail']
        acteur.commune_id = data['commune']['id_commune']
        acteur.structure = data['structure']
        acteur.profil_cognitif_id = data['profil']['id_nomenclature']
        
        # Gestion des catégories (logique originale exacte)
        if 'categories' in data:
            new_cat_ids = {c['id_nomenclature'] for c in data['categories']}
            current_cats = {c.id_nomenclature for c in acteur.categories}
            
            # Supprimer les catégories qui ne sont plus présentes
            for cat in acteur.categories[:]:
                if cat.id_nomenclature not in new_cat_ids:
                    self.logger.info(f"🗑 Retrait de la catégorie {cat.id_nomenclature}")
                    acteur.categories.remove(cat)
            
            # Ajouter les nouvelles catégories
            for cat_id in new_cat_ids - current_cats:
                self.logger.info(f"➕ Ajout de la catégorie {cat_id}")
                join = Nomenclature.query.filter_by(id_nomenclature=cat_id).first()
                if join:
                    acteur.categories.append(join)
        
        # Timestamps
        from datetime import datetime
        acteur.modified_at = datetime.utcnow()
        acteur.modified_by = data['modified_by']
        
        db.session.commit()
        
        return self.serialize(acteur)
    
    def get_with_relations(self, acteur_id, slug):
        """Récupère un acteur avec ses relations"""
        acteur = self.get_by_id_and_slug(acteur_id, slug)
        
        # Charger les relations
        acteur = Acteur.query.options(
            joinedload(Acteur.categories),
            joinedload(Acteur.sites),
            joinedload(Acteur.diagnostics)
        ).filter_by(id_acteur=acteur_id).first()
        
        return self.serialize(acteur)
    
    def change_interview_state(self, acteur_id, id_statut, modified_by):
        """Change l'état d'entretien d'un acteur (logique originale)"""
        self.logger.info(f"🔁 Changement de statut de l'acteur {acteur_id} vers {id_statut}")
        
        acteur = Acteur.query.filter_by(id_acteur=acteur_id).first()
        if not acteur:
            raise NotFound(f"Acteur {acteur_id} non trouvé")
        
        from datetime import datetime
        
        acteur.statut_entretien_id = id_statut
        acteur.modified_at = datetime.utcnow()
        acteur.modified_by = modified_by
        
        db.session.commit()
        
        self.logger.info(f"✅ Statut mis à jour pour l'acteur {acteur_id}")
        return self.serialize(acteur)
    
    def get_by_sites(self, site_ids):
        """Récupère les acteurs liés à des sites spécifiques via les diagnostics (logique originale)"""
        self.logger.info(f"📋 Récupération des acteurs pour les sites {site_ids}")
        
        # Récupérer les diagnostics liés aux sites
        diagnostics = db.session.query(Diagnostic.id_diagnostic).\
            join(Diagnostic.sites).\
            filter(Site.id_site.in_(site_ids)).\
            distinct().all()
        ids_diagnostics = [d.id_diagnostic for d in diagnostics]
        
        if not ids_diagnostics:
            return []
            
        # Récupérer les acteurs liés à ces diagnostics
        acteurs = Acteur.query.filter(Acteur.diagnostic_id.in_(ids_diagnostics)).all()
        return self.serialize(acteurs, many=True)
    
    def get_by_creator(self, created_by):
        """Récupère les acteurs créés par un utilisateur"""
        self.logger.info(f"📋 Récupération des acteurs créés par : {created_by}")
        
        acteurs = Acteur.query.filter_by(created_by=created_by).all()
        return self.serialize(acteurs, many=True)
    
    def create_with_diagnostic(self, data):
        """Crée un acteur avec diagnostic_id (logique spécifique)"""
        self.logger.info("➕ Création d'un nouvel acteur avec diagnostic")
        
        acteur = Acteur()
        
        # Champs de base
        acteur.nom = data['nom']
        acteur.prenom = data['prenom']
        acteur.fonction = data['fonction']
        acteur.telephone = data['telephone']
        acteur.mail = data['mail']
        acteur.commune_id = data['commune']['id_commune']
        acteur.structure = data['structure']
        acteur.profil_cognitif_id = data['profil']['id_nomenclature']
        acteur.diagnostic_id = data['diagnostic']['id_diagnostic']
        
        # Timestamps et slug
        from datetime import datetime
        import uuid
        from slugify import slugify
        
        acteur.created_at = datetime.utcnow()
        myuuid = uuid.uuid4()
        acteur.slug = slugify(acteur.nom) + '-' + str(myuuid)
        acteur.created_by = data.get('created_by', 'unknown')
        
        # Gestion des catégories
        if 'categories' in data:
            for cat_data in data['categories']:
                cat = Nomenclature.query.filter_by(id_nomenclature=cat_data['id_nomenclature']).first()
                if cat:
                    acteur.categories.append(cat)
        
        db.session.add(acteur)
        db.session.commit()
        
        self.logger.info(f"✅ Acteur créé avec ID {acteur.id_acteur}")
        return self.serialize(acteur)