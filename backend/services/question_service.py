from backend.services.base_service import BaseService
from backend.models.models import Question, Nomenclature
from backend.schemas.metier import QuestionSchema
from sqlalchemy.orm import joinedload, raiseload
from backend.app import db
from backend.error_handlers import NotFound

class QuestionService(BaseService):
    """Service pour gérer les questions"""
    
    def __init__(self):
        super().__init__(Question, QuestionSchema, 'question')
    
    def get_all_with_theme(self):
        """Récupère toutes les questions avec leur thème"""
        self.logger.info("📋 Récupération de toutes les questions avec thèmes")
        
        questions = Question.query.options(
            joinedload(Question.theme)
        ).all()
        
        return self.serialize(questions, many=True)
    
    def get_by_theme(self, theme_id):
        """Récupère les questions d'un thème spécifique"""
        self.logger.info(f"📋 Récupération des questions du thème {theme_id}")
        
        questions = Question.query.filter_by(theme_id=theme_id).all()
        return self.serialize(questions, many=True)
    
    def get_by_libelle_no_relations(self, libelle):
        """Récupère une question par libellé sans ses relations"""
        self.logger.info(f"📋 Récupération question '{libelle}' sans relations")
        
        question = db.session.query(Question).options(
            raiseload(Question.reponses),
            raiseload(Question.theme),
            raiseload(Question.choixReponses),
            raiseload(Question.theme_question)
        ).filter_by(libelle=libelle).first()

        if not question:
            raise NotFound('Question non trouvée')

        schema = self.schema(many=False, exclude=("reponses", "theme", "choixReponses", "theme_question"))
        return schema.dump(question)