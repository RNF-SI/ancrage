from backend.services.base_service import BaseService
from backend.models.models import Diagnostic, Site, Acteur, MotCle, Nomenclature, Reponse, Question, Document
from backend.schemas.metier import DiagnosticSchema, GraphMoySchema, GraphRepartitionSchema, GraphMotsClesSchema, GraphRadarSchema
from sqlalchemy import func, and_, distinct
from sqlalchemy.orm import joinedload
from backend.app import db
import json
from collections import defaultdict

class DiagnosticService(BaseService):
    """Service pour gérer les diagnostics avec la logique métier spécifique"""
    
    def __init__(self):
        super().__init__(Diagnostic, DiagnosticSchema, 'diagnostic')
        
    def get_with_relations(self, diagnostic_id, slug):
        """Récupère un diagnostic avec toutes ses relations"""
        diagnostic = self.get_by_id_and_slug(diagnostic_id, slug)
        
        # Charger les relations
        diagnostic = Diagnostic.query.options(
            joinedload(Diagnostic.sites),
            joinedload(Diagnostic.acteurs),
            joinedload(Diagnostic.mots_cles),
            joinedload(Diagnostic.reponses)
        ).filter_by(id_diagnostic=diagnostic_id).first()
        
        return self.serialize(diagnostic)
    
    def get_by_user(self, user_id):
        """Récupère tous les diagnostics d'un utilisateur"""
        self.logger.info(f"📋 Récupération des diagnostics de l'utilisateur {user_id}")
        
        diagnostics = Diagnostic.query.filter_by(created_by=user_id).all()
        return self.serialize(diagnostics, many=True)
    
    def get_published(self):
        """Récupère uniquement les diagnostics publiés"""
        self.logger.info("📋 Récupération des diagnostics publiés")
        
        diagnostics = Diagnostic.query.filter_by(publie=True).all()
        return self.serialize(diagnostics, many=True)
    
    def update_with_relations(self, diagnostic_id, slug, data):
        """Met à jour un diagnostic avec ses relations"""
        diagnostic = self.get_by_id_and_slug(diagnostic_id, slug)
        
        # Extraire les relations
        sites_data = data.pop('sites', None)
        acteurs_data = data.pop('acteurs', None)
        mots_cles_data = data.pop('mots_cles', None)
        
        # Mise à jour des champs simples via BaseService
        result = super().update(diagnostic_id, slug, data)
        
        # Mise à jour des relations many-to-many
        if sites_data is not None:
            self.update_many_to_many(diagnostic, 'sites', sites_data, Site, 'id_site')
        if acteurs_data is not None:
            self.update_many_to_many(diagnostic, 'acteurs', acteurs_data, Acteur, 'id_acteur')
        if mots_cles_data is not None:
            self.update_many_to_many(diagnostic, 'mots_cles', mots_cles_data, MotCle, 'id_mot_cle')
            
        db.session.commit()
        
        # Recharger avec les relations pour le retour
        return self.get_with_relations(diagnostic_id, diagnostic.slug)
    
    def copy_actors_from_sites(self, diagnostic_id, site_ids):
        """Copie les acteurs des sites vers le diagnostic"""
        self.logger.info(f"📋 Copie des acteurs depuis les sites {site_ids}")
        
        # Récupérer tous les acteurs uniques des sites
        acteurs = db.session.query(Acteur).join(
            Acteur.sites
        ).filter(
            Site.id_site.in_(site_ids)
        ).distinct().all()
        
        # Ajouter au diagnostic
        diagnostic = Diagnostic.query.get(diagnostic_id)
        if diagnostic:
            diagnostic.acteurs.extend(acteurs)
            db.session.commit()
            
        return len(acteurs)
    
    def calculate_graph_moy(self, diagnostic_id):
        """Calcule les moyennes par thème pour le graphique"""
        self.logger.info(f"📊 Calcul du graphique des moyennes pour diagnostic {diagnostic_id}")
        
        # Requête pour calculer les moyennes par thème
        results = db.session.query(
            Nomenclature.libelle.label('theme'),
            func.avg(Reponse.note).label('moyenne')
        ).join(
            Question, Question.id_question == Reponse.question_id
        ).join(
            Nomenclature, Nomenclature.id_nomenclature == Question.theme_id
        ).filter(
            Reponse.diagnostic_id == diagnostic_id,
            Reponse.note.isnot(None)
        ).group_by(
            Nomenclature.libelle
        ).all()
        
        # Formatter les résultats
        graph_data = []
        for theme, moyenne in results:
            graph_data.append({
                'theme': theme,
                'moyenne': round(float(moyenne), 2) if moyenne else 0
            })
            
        return GraphMoySchema(many=True).dump(graph_data)
    
    def calculate_graph_repartition(self, diagnostic_id):
        """Calcule la répartition des notes pour le graphique"""
        self.logger.info(f"📊 Calcul du graphique de répartition pour diagnostic {diagnostic_id}")
        
        # Requête pour compter les notes par valeur et thème
        results = db.session.query(
            Nomenclature.libelle.label('theme'),
            Reponse.note,
            func.count(Reponse.id_reponse).label('count')
        ).join(
            Question, Question.id_question == Reponse.question_id
        ).join(
            Nomenclature, Nomenclature.id_nomenclature == Question.theme_id
        ).filter(
            Reponse.diagnostic_id == diagnostic_id,
            Reponse.note.isnot(None)
        ).group_by(
            Nomenclature.libelle,
            Reponse.note
        ).all()
        
        # Organiser les données par thème
        repartition = defaultdict(lambda: {0: 0, 1: 0, 2: 0, 3: 0})
        for theme, note, count in results:
            if note is not None:
                repartition[theme][int(note)] = count
                
        # Formatter pour le retour
        graph_data = []
        for theme, notes in repartition.items():
            graph_data.append({
                'theme': theme,
                'note_0': notes[0],
                'note_1': notes[1],
                'note_2': notes[2],
                'note_3': notes[3]
            })
            
        return GraphRepartitionSchema(many=True).dump(graph_data)
    
    def calculate_graph_mots_cles(self, diagnostic_id):
        """Calcule le graphique des mots-clés"""
        self.logger.info(f"📊 Calcul du graphique des mots-clés pour diagnostic {diagnostic_id}")
        
        # Compter les occurrences de chaque mot-clé
        results = db.session.query(
            MotCle.nom,
            func.count(distinct(Reponse.id_reponse)).label('count')
        ).join(
            MotCle.reponses
        ).filter(
            Reponse.diagnostic_id == diagnostic_id
        ).group_by(
            MotCle.nom
        ).order_by(
            func.count(distinct(Reponse.id_reponse)).desc()
        ).limit(20).all()
        
        graph_data = []
        for nom, count in results:
            graph_data.append({
                'mot_cle': nom,
                'count': count
            })
            
        return GraphMotsClesSchema(many=True).dump(graph_data)
    
    def calculate_graph_radar(self, diagnostic_id):
        """Calcule les données pour le graphique radar"""
        self.logger.info(f"📊 Calcul du graphique radar pour diagnostic {diagnostic_id}")
        
        # Calculer les moyennes par profil cognitif
        results = db.session.query(
            Nomenclature.libelle.label('profil'),
            func.avg(Reponse.note).label('moyenne')
        ).select_from(Reponse).join(
            Reponse.acteur
        ).join(
            Acteur.profil
        ).filter(
            Reponse.diagnostic_id == diagnostic_id,
            Reponse.note.isnot(None)
        ).group_by(
            Nomenclature.libelle
        ).all()
        
        graph_data = []
        for profil, moyenne in results:
            graph_data.append({
                'profil': profil,
                'moyenne': round(float(moyenne), 2) if moyenne else 0
            })
            
        return GraphRadarSchema(many=True).dump(graph_data)
    
    def update_afom(self, diagnostic_id, afom_data):
        """Met à jour l'analyse AFOM du diagnostic"""
        self.logger.info(f"📝 Mise à jour AFOM pour diagnostic {diagnostic_id}")
        
        diagnostic = Diagnostic.query.get(diagnostic_id)
        if not diagnostic:
            raise NotFound(f"Diagnostic {diagnostic_id} non trouvé")
            
        # Mettre à jour les champs AFOM
        if 'atouts' in afom_data:
            diagnostic.atouts = afom_data['atouts']
        if 'faiblesses' in afom_data:
            diagnostic.faiblesses = afom_data['faiblesses']
        if 'opportunites' in afom_data:
            diagnostic.opportunites = afom_data['opportunites']
        if 'menaces' in afom_data:
            diagnostic.menaces = afom_data['menaces']
            
        db.session.commit()
        
        return {
            'atouts': diagnostic.atouts,
            'faiblesses': diagnostic.faiblesses,
            'opportunites': diagnostic.opportunites,
            'menaces': diagnostic.menaces
        }
    
    def manage_documents(self, diagnostic_id, documents_data, action='add'):
        """Gère les documents du diagnostic"""
        diagnostic = Diagnostic.query.get(diagnostic_id)
        if not diagnostic:
            raise NotFound(f"Diagnostic {diagnostic_id} non trouvé")
            
        if action == 'add':
            for doc_data in documents_data:
                document = Document(
                    nom=doc_data['nom'],
                    url=doc_data['url'],
                    diagnostic_id=diagnostic_id
                )
                db.session.add(document)
        elif action == 'remove':
            Document.query.filter_by(
                diagnostic_id=diagnostic_id,
                id_document__in=[d['id_document'] for d in documents_data]
            ).delete()
            
        db.session.commit()
        return True
    
    def delete_actors(self, diagnostic_id):
        """Supprime les acteurs copiés d'un diagnostic"""
        self.logger.info(f"🗑️ Suppression acteurs copiés pour diagnostic {diagnostic_id}")
        
        deleted_count = Acteur.query.filter(
            Acteur.diagnostic_id == diagnostic_id,
            Acteur.is_copy == True
        ).delete()
        
        db.session.commit()
        return deleted_count