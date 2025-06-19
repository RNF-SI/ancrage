from backend.services.base_service import BaseService
from backend.models.models import MotCle, Diagnostic, Nomenclature, Reponse, Acteur
from backend.schemas.metier import MotCleSchema
from sqlalchemy.orm import joinedload
from backend.app import db
from werkzeug.exceptions import NotFound

class MotCleService(BaseService):
    """Service pour gérer les mots-clés"""
    
    def __init__(self):
        super().__init__(MotCle, MotCleSchema, 'mot_cle')
    
    def get_by_diagnostic(self, diagnostic_id):
        """Récupère les mots-clés d'un diagnostic"""
        self.logger.info(f"📋 Récupération des mots-clés du diagnostic {diagnostic_id}")
        
        mots_cles = MotCle.query.filter_by(diagnostic_id=diagnostic_id).all()
        return self.serialize(mots_cles, many=True)
    
    def update_with_relations(self, mot_cle_id, data):
        """Met à jour un mot-clé avec ses relations"""
        mot_cle = MotCle.query.get(mot_cle_id)
        if not mot_cle:
            raise NotFound(f"Mot-clé {mot_cle_id} non trouvé")
        
        # Mise à jour des champs
        if 'nom' in data:
            mot_cle.nom = data['nom']
        if 'categorie_id' in data:
            mot_cle.categorie_id = data['categorie_id']
        if 'mot_cle_id_groupe' in data:
            mot_cle.mot_cle_id_groupe = data['mot_cle_id_groupe']
        if 'is_actif' in data:
            mot_cle.is_actif = data['is_actif']
        
        # Gestion des mots-clés issus
        if 'mots_cles_issus' in data:
            # Vider les relations existantes
            mot_cle.mots_cles_issus = []
            # Ajouter les nouvelles
            for mc_data in data['mots_cles_issus']:
                mc_issu = MotCle.query.get(mc_data.get('id_mot_cle'))
                if mc_issu:
                    mot_cle.mots_cles_issus.append(mc_issu)
        
        db.session.commit()
        return self.serialize(mot_cle)
    
    def get_active_by_diagnostic(self, diagnostic_id):
        """Récupère uniquement les mots-clés actifs d'un diagnostic"""
        self.logger.info(f"📋 Récupération des mots-clés actifs du diagnostic {diagnostic_id}")
        
        mots_cles = MotCle.query.filter_by(
            diagnostic_id=diagnostic_id,
            is_actif=True
        ).all()
        
        return self.serialize(mots_cles, many=True)
    
    def get_by_actor(self, acteur_id):
        """Récupère les mots-clés liés à un acteur"""
        self.logger.info(f"📋 Récupération des mots-clés pour l'acteur {acteur_id}")
        
        mots_cles = (
            db.session.query(MotCle)
            .join(MotCle.reponses)
            .join(Reponse.acteur)
            .filter(Acteur.id_acteur == acteur_id)
            .options(joinedload(MotCle.categorie))
            .all()
        )
        
        self.logger.debug(f"🔍 {len(mots_cles)} mots-clés récupérés pour l'acteur {acteur_id}")
        return self.serialize(mots_cles, many=True)
    
    def create_with_children(self, data):
        """Crée un mot-clé parent avec ses enfants"""
        self.logger.info("➕ Création d'un mot-clé avec enfants")
        
        try:
            # Création du mot-clé parent
            mot_cle = MotCle(
                nom=data.get('nom'),
                categorie_id=data['categorie']['id_nomenclature'],
                mots_cles_groupe_id=data.get('mots_cles_groupe_id'),
                diagnostic_id=data['diagnostic']['id_diagnostic'],
                is_actif=data.get('is_actif', True)
            )
            db.session.add(mot_cle)
            db.session.flush()  # pour récupérer l'ID du parent

            enfants_data = data.get('mots_cles_issus', [])
            enfants_ids = []

            for enfant_data in enfants_data:
                enfant_id = enfant_data.get('id_mot_cle')
                if enfant_id:
                    # Mettre à jour un mot-clé existant
                    enfant = MotCle.query.get(enfant_id)
                    if enfant:
                        enfant.mots_cles_groupe_id = mot_cle.id_mot_cle
                        enfants_ids.append(enfant.id_mot_cle)
                    else:
                        raise NotFound(f"Mot-clé enfant avec id {enfant_id} introuvable")
                else:
                    # Créer un nouveau mot-clé enfant
                    enfant = MotCle(
                        nom=enfant_data.get('nom'),
                        categorie_id=enfant_data.get('categorie_id'),
                        diagnostic_id=enfant_data.get('diagnostic_id', mot_cle.diagnostic_id),
                        mots_cles_groupe_id=mot_cle.id_mot_cle,
                        is_actif=enfant_data.get('is_actif', True)
                    )
                    db.session.add(enfant)
                    db.session.flush()
                    enfants_ids.append(enfant.id_mot_cle)

            db.session.commit()
            self.logger.info(f"✅ Mot-clé créé avec {len(enfants_ids)} enfants")
            return self.serialize(mot_cle)

        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Erreur création mot-clé avec enfants: {str(e)}")
            raise