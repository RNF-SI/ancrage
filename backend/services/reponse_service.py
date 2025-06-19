from backend.services.base_service import BaseService
from backend.models.models import Reponse, MotCle, Diagnostic, Acteur, Nomenclature, Afom, reponse_mot_cle
from backend.schemas.metier import ReponseSchema
from sqlalchemy.orm import joinedload
from backend.app import db
from werkzeug.exceptions import NotFound
from sqlalchemy import func
from datetime import datetime

class ReponseService(BaseService):
    """Service pour gérer les réponses"""
    
    def __init__(self):
        super().__init__(Reponse, ReponseSchema, 'reponse')
    
    def update_with_mots_cles(self, reponse_id, data):
        """Met à jour une réponse avec ses mots-clés"""
        reponse = Reponse.query.get(reponse_id)
        if not reponse:
            raise NotFound(f"Réponse {reponse_id} non trouvée")
        
        # Mise à jour des champs simples
        if 'note' in data:
            reponse.note = data['note']
        if 'texte' in data:
            reponse.texte = data['texte']
        
        # Mise à jour des mots-clés
        if 'mots_cles' in data:
            self.update_many_to_many(reponse, 'mots_cles', data['mots_cles'], MotCle, 'id_mot_cle')
        
        db.session.commit()
        return self.serialize(reponse)
    
    def get_by_diagnostic_and_question(self, diagnostic_id, question_id):
        """Récupère une réponse spécifique par diagnostic et question"""
        self.logger.info(f"📋 Récupération de la réponse pour diagnostic {diagnostic_id} et question {question_id}")
        
        reponse = Reponse.query.filter_by(
            diagnostic_id=diagnostic_id,
            question_id=question_id
        ).first()
        
        if reponse:
            return self.serialize(reponse)
        return None
    
    def bulk_update(self, diagnostic_id, reponses_data):
        """Met à jour plusieurs réponses en une fois"""
        self.logger.info(f"📋 Mise à jour en masse des réponses pour diagnostic {diagnostic_id}")
        
        updated_count = 0
        for reponse_data in reponses_data:
            question_id = reponse_data.get('question_id')
            if not question_id:
                continue
                
            reponse = Reponse.query.filter_by(
                diagnostic_id=diagnostic_id,
                question_id=question_id
            ).first()
            
            if not reponse:
                # Créer une nouvelle réponse
                reponse = Reponse(
                    diagnostic_id=diagnostic_id,
                    question_id=question_id
                )
                db.session.add(reponse)
            
            # Mettre à jour les champs
            if 'note' in reponse_data:
                reponse.note = reponse_data['note']
            if 'texte' in reponse_data:
                reponse.texte = reponse_data['texte']
            if 'acteur_id' in reponse_data:
                reponse.acteur_id = reponse_data['acteur_id']
                
            updated_count += 1
        
        db.session.commit()
        return {"message": f"{updated_count} réponses mises à jour"}
    
    def get_repartition_mots_cles(self, diagnostic_id):
        """Calcule la répartition des mots-clés pour un diagnostic"""
        self.logger.info(f"📊 Calcul répartition mots-clés pour diagnostic {diagnostic_id}")
        
        mots_cles = (
            db.session.query(MotCle)
            .filter(MotCle.diagnostic_id == diagnostic_id)
            .all()
        )

        counts = dict(
            db.session.query(
                MotCle.id_mot_cle,
                func.count(Reponse.id_reponse)
            )
            .join(reponse_mot_cle, reponse_mot_cle.c.mot_cle_id == MotCle.id_mot_cle)
            .join(Reponse, reponse_mot_cle.c.reponse_id == Reponse.id_reponse)
            .filter(MotCle.diagnostic_id == diagnostic_id)
            .group_by(MotCle.id_mot_cle)
            .all()
        )

        data = []
        for mc in mots_cles:
            data.append({
                "mot_cle_obj": mc, 
                "id": mc.id_mot_cle,
                "nom": mc.nom,
                "nombre": counts.get(mc.id_mot_cle, 0),
                "categorie": mc.categorie,
                "mots_cles_issus": mc.mots_cles_issus
            })

        return data
    
    def verif_complete_status(self, acteur_id):
        """Vérifie et met à jour le statut d'entretien d'un acteur"""
        self.logger.info(f"🔍 Vérification statut pour acteur {acteur_id}")
        
        nb_reponses = db.session.query(func.count(Reponse.id_reponse)).filter_by(acteur_id=acteur_id).scalar()
        nomenclatures = Nomenclature.query.filter_by(mnemonique="statut_entretien").all()
        
        statut_entretien_id = 0
        if nb_reponses == 37:
            for statut in nomenclatures:
                if statut.libelle == 'Réalisé':
                    statut_entretien_id = statut.id_nomenclature
                    break
        elif nb_reponses < 37:
            for statut in nomenclatures:
                if statut.libelle == 'En cours':
                    statut_entretien_id = statut.id_nomenclature
                    break
        
        acteur = Acteur.query.filter_by(id_acteur=acteur_id).first()
        if acteur:
            acteur.statut_entretien_id = statut_entretien_id
            db.session.add(acteur)
            db.session.commit()
            self.logger.info(f"✅ Statut mis à jour pour acteur {acteur_id}: {nb_reponses} réponses")
    
    def verif_dates_entretien(self, diagnostic_id):
        """Vérifie et met à jour les dates d'entretien d'un diagnostic"""
        self.logger.info(f"📅 Vérification dates entretien pour diagnostic {diagnostic_id}")
        
        diagnostic = Diagnostic.query.filter_by(id_diagnostic=diagnostic_id).first()
        if not diagnostic:
            return
       
        listeTermines = []
        for actor in diagnostic.acteurs:
            if actor.statut_entretien and actor.statut_entretien.libelle == 'Réalisé':
                listeTermines.append(actor)

        self.logger.info(f"Nombre d'acteurs avec entretien 'Réalisé' : {len(listeTermines)}")

        if len(listeTermines) == 1:
            diagnostic.date_debut = datetime.utcnow()
        if len(listeTermines) == len(diagnostic.acteurs):
            diagnostic.date_fin = datetime.utcnow()

        db.session.add(diagnostic)
        db.session.commit()
    
    def record_afoms(self, diagnostic_id, mots_cles_repartis):
        """Enregistre les AFOM basées sur la répartition des mots-clés"""
        self.logger.info(f"📝 Enregistrement AFOM pour diagnostic {diagnostic_id}")
        
        # Suppression des AFOM précédents liés aux mots-clés de ce diagnostic
        afom_ids_to_delete = (
            db.session.query(Afom.id_afom)
            .join(Afom.mot_cle)
            .filter(MotCle.diagnostic_id == diagnostic_id)
            .all()
        )

        afom_ids_to_delete = [id_tuple[0] for id_tuple in afom_ids_to_delete]
        if afom_ids_to_delete:
            db.session.query(Afom).filter(Afom.id_afom.in_(afom_ids_to_delete)).delete(synchronize_session=False)

        # Ajout des nouveaux AFOM
        for item in mots_cles_repartis:
            mot_cle = item["mot_cle_obj"]
            count = item["nombre"]
            afom = Afom(
                mot_cle_id=mot_cle.id_mot_cle,
                number=count
            )
            db.session.add(afom)

        db.session.commit()
        self.logger.info(f"✅ AFOM enregistrés pour diagnostic {diagnostic_id}")