from backend.services.base_service import BaseService
from backend.models.models import Diagnostic, Site, Acteur, MotCle, Nomenclature, Reponse, Question, Document, acteur_categorie
from backend.schemas.metier import DiagnosticSchema, GraphMoySchema, GraphRepartitionSchema, GraphMotsClesSchema, GraphRadarSchema
from sqlalchemy import func, and_, distinct, aliased
from sqlalchemy.orm import joinedload
from backend.app import db
import json
import os
from collections import defaultdict
from werkzeug.utils import secure_filename
from datetime import datetime
from flask import current_app

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
    
    def get_average_by_question(self, diagnostic_id):
        """Calcule les moyennes par question pour les graphiques"""
        self.logger.info(f"📊 Calcul moyennes par question pour diagnostic {diagnostic_id}")
        
        # Aliases pour les différentes utilisations de Nomenclature
        ValeurReponse = aliased(Nomenclature)     # tn
        Categorie = aliased(Nomenclature)         # tn3
        Theme = aliased(Nomenclature)             # tn4

        query = (
            db.session.query(
                Theme.libelle.label("theme"),
                Theme.id_nomenclature.label("theme_id"),
                Question.id_question.label("id_question"),
                Question.libelle_graphique.label("question"),
                Categorie.libelle_court.label("categorie_acteur"),
                func.avg(ValeurReponse.value).label("moyenne_score")
            )
            .select_from(Diagnostic)  
            .join(Acteur, Diagnostic.id_diagnostic == Acteur.diagnostic_id)
            .join(Reponse, Acteur.id_acteur == Reponse.acteur_id)
            .join(ValeurReponse, Reponse.valeur_reponse_id == ValeurReponse.id_nomenclature)
            .join(Question, Reponse.question_id == Question.id_question)
            .join(Theme, Question.theme_id == Theme.id_nomenclature)
            .join(acteur_categorie, acteur_categorie.c.acteur_id == Acteur.id_acteur)
            .join(Categorie, Categorie.id_nomenclature == acteur_categorie.c.categorie_id)
            .filter(Diagnostic.id_diagnostic==diagnostic_id)
            .group_by(
                Theme.id_nomenclature,
                Question.id_question,
                Categorie.id_nomenclature
            )
            .order_by(Theme.id_nomenclature,Question.id_question)
        )

        results = query.all()
        data = [
            {
                "theme": r.theme,
                "question": r.question,
                "categorie": r.categorie_acteur,
                "moyenne": float(r.moyenne_score),
                "id_question":r.id_question,
                "theme_id":r.theme_id
            }
            for r in results
        ]
        return data
    
    def get_reponses_par_theme(self, diagnostic_id):
        """Calcule la répartition des réponses par thème"""
        self.logger.info(f"📊 Calcul répartition par thème pour diagnostic {diagnostic_id}")
        
        ValeurReponse = aliased(Nomenclature)
        Categorie = aliased(Nomenclature)
        Theme = aliased(Nomenclature)

        results = (
            db.session.query(
                Theme.libelle.label("theme"),
                Theme.id_nomenclature.label("theme_id"),
                Question.libelle_graphique.label("question"),
                Question.id_question.label("id_question"),
                ValeurReponse.libelle.label("reponse"),
                func.count(Reponse.id_reponse).label("nombre"),
                ValeurReponse.value.label("valeur")
            )
            .select_from(Diagnostic)  
            .join(Acteur, Diagnostic.id_diagnostic == Acteur.diagnostic_id)
            .join(Reponse, Acteur.id_acteur == Reponse.acteur_id)
            .join(ValeurReponse, Reponse.valeur_reponse_id == ValeurReponse.id_nomenclature)
            .join(Question, Reponse.question_id == Question.id_question)
            .join(Theme, Question.theme_id == Theme.id_nomenclature)
            .filter(Diagnostic.id_diagnostic==diagnostic_id)
            .group_by(Theme.id_nomenclature, Question.id_question, ValeurReponse.value, ValeurReponse.libelle)
            .order_by(Theme.id_nomenclature,Question.id_question, ValeurReponse.value)
            .all()
        )

        # transformer en liste de dicts
        output = [
            {
                "theme": r.theme,
                "question": r.question,
                "reponse": r.reponse,
                "nombre": r.nombre,
                "valeur": r.valeur,
                "id_question":r.id_question,
                "theme_id":r.theme_id
            }
            for r in results
        ]

        return output
    
    def get_structures_by_diagnostic(self, diagnostic_id):
        """Récupère les structures distinctes d'un diagnostic"""
        self.logger.info(f"🏢 Récupération structures pour diagnostic {diagnostic_id}")
        
        structures = (
            db.session.query(Acteur.structure)
            .filter(Acteur.diagnostic_id == diagnostic_id)
            .filter(Acteur.structure.isnot(None))
            .distinct()
            .all()
        )

        structure_list = [s[0] for s in structures]
        return {'structures': structure_list}
    
    def get_scores_radar(self, diagnostic_id):
        """Calcule les scores pour le graphique radar"""
        self.logger.info(f"📊 Calcul scores radar pour diagnostic {diagnostic_id}")
        
        ValeurReponse = aliased(Nomenclature)
        Categorie = aliased(Nomenclature)
        Theme = aliased(Nomenclature)

        # Jointure ORM
        results = (
            db.session.query(
                func.avg(ValeurReponse.value).label("score"),
                Question.libelle_graphique.label("libelle_graphique"),
                Categorie.libelle.label("categorie"),
                Theme.libelle.label("theme"),
                Theme.id_nomenclature.label("theme_id"),
                Question.id_question.label("id_question"),

            )
            .select_from(Diagnostic)  
            .join(Acteur, Diagnostic.id_diagnostic == Acteur.diagnostic_id)
            .join(Reponse, Acteur.id_acteur == Reponse.acteur_id)
            .join(ValeurReponse, Reponse.valeur_reponse_id == ValeurReponse.id_nomenclature)
            .join(Question, Reponse.question_id == Question.id_question)
            .join(Theme, Question.theme_id == Theme.id_nomenclature)
            .join(acteur_categorie, acteur_categorie.c.acteur_id == Acteur.id_acteur)
            .join(Categorie, Categorie.id_nomenclature == acteur_categorie.c.categorie_id)
            .filter(Diagnostic.id_diagnostic==diagnostic_id)
            .group_by(Theme.id_nomenclature,Question.id_question,Question.libelle_graphique,Categorie.libelle,Theme.libelle)
            .order_by(Theme.id_nomenclature,Question.id_question)
            .all()
        )

        # Formatage JSON
        data = [
            {
                "score": round(r.score, 2) if r.score is not None else None,
                "libelle_graphique": r.libelle_graphique,
                "categorie": r.categorie,
                "theme": r.theme,
                "id_question": r.id_question,
                "theme_id":r.theme_id
            }
            for r in results
        ]

        return data
    
    def create_documents(self, documents_data, files):
        """Crée et upload des documents pour un diagnostic"""
        self.logger.info(f"📁 Création de {len(documents_data)} documents")
        
        upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")

        # Créer le répertoire avec permissions 755 s'il n'existe pas
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder, mode=0o755, exist_ok=True)

        diagnostic_id = None
        for doc in documents_data:
            nom = doc.get("nom")
            diagnostic_id = doc.get("diagnostic", {}).get("id_diagnostic")

            document = Document(
                nom=nom,
                diagnostic_id=diagnostic_id  
            )
            db.session.add(document)

            # Cherche le fichier correspondant par nom
            file = next((f for f in files if f.filename == nom), None)

            # Sauvegarder le fichier si trouvé
            if file:
                file_path = os.path.join(upload_folder, secure_filename(file.filename))
                file.save(file_path)

        db.session.commit()

        # Retourner le diagnostic lié au dernier document inséré
        if diagnostic_id:
            diagnostic = Diagnostic.query.filter_by(id_diagnostic=diagnostic_id).first()
            return self.serialize(diagnostic)
        return None
    
    def update_diagnostic_values(self, diagnostic, data):
        """Met à jour les valeurs d'un diagnostic (helper refactorisé)"""
        self.logger.info(f"🔄 Mise à jour des valeurs du diagnostic {diagnostic.id_diagnostic}")
        
        diagnostic.nom = data.get('nom', diagnostic.nom)
        if data.get('date_debut'):
            diagnostic.date_debut = data['date_debut']

        if data.get('date_fin'):
            diagnostic.date_fin = data['date_fin']

        # Extraire les ID des nouveaux sites
        new_site_ids = {s['id_site'] for s in data.get('sites', [])}
        current_site_ids = {s.id_site for s in diagnostic.sites}

        # Supprimer les sites en trop
        diagnostic.sites = [s for s in diagnostic.sites if s.id_site in new_site_ids]

        # Ajouter les nouveaux sites manquants
        for site_id in new_site_ids - current_site_ids:
            site = Site.query.filter_by(id_site=site_id).first()
            if site:
                diagnostic.sites.append(site)
            else:
                self.logger.info(f"Site ID {site_id} not found in database.")

        if 'acteurs' in data:
            
            new_actors_ids = {a['id_acteur'] for a in data['acteurs']}
            acteurs_orig = Acteur.query.filter(Acteur.id_acteur.in_(new_actors_ids)).all()
            
            """ deleteActors(diagnostic.id_diagnostic) """

            copied_acteurs = []
            with db.session.no_autoflush:
                for a in acteurs_orig:
                    new_acteur = Acteur(
                        nom=a.nom,
                        prenom=a.prenom,
                        fonction=a.fonction,
                        telephone=a.telephone,
                        mail=a.mail,
                        commune_id=a.commune_id,
                        structure=a.structure,
                        created_at=datetime.utcnow(),
                        created_by=data['created_by'],
                        diagnostic_id=diagnostic.id_diagnostic,
                        categories=a.categories,
                        slug=a.slug,
                        profil_cognitif_id=a.profil_cognitif_id,
                        acteur_origine_id = a.acteur_origine_id if a.acteur_origine_id else a.id_acteur,
                        is_copy=True
                    )
                    db.session.add(new_acteur)
                    copied_acteurs.append(new_acteur)

                diagnostic.acteurs = copied_acteurs

        return diagnostic
    
    def print_diagnostic_info(self, diagnostic):
        """Log les informations d'un diagnostic (helper refactorisé)"""
        self.logger.info("🔍 Diagnostic :")
        self.logger.info(f"  ID              : {diagnostic.id_diagnostic}")
        self.logger.info(f"  Nom             : {diagnostic.nom}")
        self.logger.info(f"  Date début      : {diagnostic.date_debut}")
        self.logger.info(f"  Date fin        : {diagnostic.date_fin}")
        self.logger.info(f"  Date rapport    : {diagnostic.date_rapport}")
        self.logger.info(f"  Créé par        : {diagnostic.created_by}")
        self.logger.info(f"  Est en lecture seule : {diagnostic.is_read_only}")
        self.logger.info(f"  Sites associés  : {[site.id_site for site in diagnostic.sites]}")
        self.logger.info(f"  Acteurs associés: {[acteur.id_acteur for acteur in diagnostic.acteurs]}")