from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp,joinedload


@bp.route('/mots_cles/<int:id_diagnostic>',methods=['GET'])
def getAllMotCles(id_diagnostic):
    if request.method == 'GET': 
        
        mot_cles = MotCle.query.filter_by(diagnostic_id=id_diagnostic).all()
        schema = MotCleSchema(many=True)
        usersObj = schema.dump(mot_cles)
        return jsonify(usersObj)

@bp.route('/mots_cles/theme/<int:id_acteur>', methods=['GET'])
def getKeywordsByActor(id_acteur):
    
    mots_cles = (
        db.session.query(MotCle)
        .join(MotCle.reponses)
        .join(Reponse.acteur)
        .filter(Acteur.id_acteur == id_acteur)
        .options(joinedload(MotCle.categories))
        .all()
    )
            
    schema = MotCleSchema(many=True)
    return jsonify(schema.dump(mots_cles))
