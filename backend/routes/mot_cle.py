from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp

@bp.route('/mots_cles/<int:id_diagnostic>',methods=['GET'])
def getAllMotCles(id_diagnostic):
    if request.method == 'GET': 
        
        mot_cles = MotCle.query.filter_by(diagnostic_id=id_diagnostic).all()
        schema = MotCleSchema(many=True)
        usersObj = schema.dump(mot_cles)
        return jsonify(usersObj)
