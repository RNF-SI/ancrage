from flask import jsonify, abort
from sqlalchemy.exc import SQLAlchemyError
from backend.app import db
from backend.routes.logger_config import setup_logger
from backend.error_handlers import NotFound, DatabaseError
from slugify import slugify
import uuid
from datetime import datetime

class BaseService:
    """Classe de base pour factoriser les opérations CRUD communes"""
    
    def __init__(self, model, schema, entity_name, id_field=None):
        self.model = model
        self.schema = schema
        self.entity_name = entity_name
        self.id_field = id_field or f'id_{entity_name}'
        self.logger = setup_logger(f"{entity_name}_service")
        
    def get_by_id_and_slug(self, entity_id, slug):
        """Récupère une entité par ID et vérifie le slug"""
        self.logger.info(f"🔍 Recherche {self.entity_name} avec ID {entity_id} et slug '{slug}'")
        
        entity = self.model.query.filter_by(**{self.id_field: entity_id}).first()
        
        if not entity:
            self.logger.warning(f"❌ Aucun(e) {self.entity_name} trouvé(e) avec l'ID {entity_id}")
            raise NotFound(f"{self.entity_name.capitalize()} non trouvé(e)")
            
        if entity.slug != slug:
            self.logger.warning(f"❌ Slug invalide pour {self.entity_name} ID: {entity_id}")
            from backend.error_handlers import BadRequest
            raise BadRequest("Slug invalide")
            
        return entity
    
    def get_all(self):
        """Récupère toutes les entités"""
        self.logger.info(f"📋 Récupération de tous les {self.entity_name}s")
        
        entities = self.model.query.all()
        return self.schema(many=True).dump(entities)
    
    def create(self, data):
        """Crée une nouvelle entité"""
        self.logger.info(f"➕ Création d'un(e) nouveau/nouvelle {self.entity_name}")
        
        try:
            entity = self.model()
            
            # Appliquer les valeurs de base
            for key, value in data.items():
                if hasattr(entity, key) and key not in ['created_at', 'created_by', 'slug']:
                    setattr(entity, key, value)
            
            # Génération du slug si l'entité a un nom
            if hasattr(entity, 'slug') and hasattr(entity, 'nom'):
                myuuid = uuid.uuid4()
                entity.slug = slugify(entity.nom) + '-' + str(myuuid)
            
            # Timestamps
            if hasattr(entity, 'created_at'):
                entity.created_at = datetime.utcnow()
            if hasattr(entity, 'created_by') and 'created_by' in data:
                entity.created_by = data['created_by']
                
            db.session.add(entity)
            db.session.commit()
            
            self.logger.info(f"✅ {self.entity_name.capitalize()} créé(e) avec succès")
            return self.schema().dump(entity)
            
        except SQLAlchemyError as e:
            db.session.rollback()
            self.logger.error(f"Erreur DB lors de la création de {self.entity_name}: {e}")
            raise DatabaseError(f"Erreur lors de la création de {self.entity_name}")
    
    def update(self, entity_id, slug, data):
        """Met à jour une entité"""
        entity = self.get_by_id_and_slug(entity_id, slug)
        
        self.logger.info(f"✏️ Mise à jour du/de la {self.entity_name} ID {entity_id}")
        
        # Mise à jour des champs simples
        for key, value in data.items():
            if hasattr(entity, key) and key not in ['modified_at', 'modified_by', 'created_at', 'created_by']:
                setattr(entity, key, value)
        
        # Mise à jour du slug si le nom change
        if 'nom' in data and hasattr(entity, 'slug'):
            myuuid = str(uuid.uuid4())
            entity.slug = slugify(data['nom']) + '-' + myuuid
        
        # Timestamps
        if hasattr(entity, 'modified_at'):
            entity.modified_at = datetime.utcnow()
        if hasattr(entity, 'modified_by') and 'modified_by' in data:
            entity.modified_by = data['modified_by']
            
        db.session.commit()
        
        self.logger.info(f"✅ {self.entity_name.capitalize()} ID {entity_id} mis(e) à jour")
        return self.schema().dump(entity)
    
    def delete(self, entity_id, slug):
        """Supprime une entité"""
        entity = self.get_by_id_and_slug(entity_id, slug)
        
        self.logger.info(f"🗑️ Suppression du/de la {self.entity_name} ID {entity_id}")
        
        db.session.delete(entity)
        db.session.commit()
        
        self.logger.info(f"✅ {self.entity_name.capitalize()} ID {entity_id} supprimé(e)")
        return {"message": f"{self.entity_name.capitalize()} supprimé(e) avec succès"}
    
    def serialize(self, entity, many=False):
        """Sérialise une ou plusieurs entités"""
        return self.schema(many=many).dump(entity)
    
    def update_many_to_many(self, entity, relation_name, new_items, item_model, item_id_field):
        """Helper pour mettre à jour une relation many-to-many"""
        relation = getattr(entity, relation_name)
        
        # Obtenir les IDs actuels et nouveaux
        new_ids = {item[item_id_field] for item in new_items} if isinstance(new_items[0], dict) else set(new_items)
        current_ids = {getattr(item, item_id_field) for item in relation}
        
        # Supprimer les relations qui ne sont plus présentes
        for item in relation[:]:
            if getattr(item, item_id_field) not in new_ids:
                relation.remove(item)
        
        # Ajouter les nouvelles relations
        for item_id in new_ids - current_ids:
            item = item_model.query.filter_by(**{item_id_field: item_id}).first()
            if item:
                relation.append(item)