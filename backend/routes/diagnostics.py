from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.geo import *
from schemas.metier import *
from routes import bp,date_time

@bp.route('/diagnostic/<id_diagnostic>', methods=['GET','PUT','DELETE'])
def diagnosticMethods(id_diagnostic):
    diagnostic = Diagnostic.query.filter_by(id_diagnostic=id_diagnostic).first()
    
    print(diagnostic)
    if request.method == 'GET':

       return getDiagnostic(diagnostic)
    
    
    elif request.method == 'PUT':
        data = request.get_json()
        diagnostic = changeValuesDiagnostic(diagnostic,data)
        diagnostic.modified_at = date_time

        db.session.commit()
        return getDiagnostic(diagnostic)

    elif request.method == 'DELETE':

        db.session.delete(diagnostic)
        db.session.commit()
        return {"success": "Suppression terminée"}
    
@bp.route('/diagnostic',methods=['POST'])
def postDiagnostic():
    if request.method == 'POST': 
        
        data = request.get_json()
        print(data)
        diagnostic=Diagnostic()
        diagnostic = changeValuesDiagnostic(diagnostic,data)
        diagnostic.created_at = date_time
        diagnostic.created_by = data['created_by']
        db.session.add(diagnostic)
        db.session.commit()
        return getDiagnostic(diagnostic)

@bp.route('/diagnostics',methods=['GET'])
def getAllDiagnostics():
    if request.method == 'GET': 
        
        diagnostics = Diagnostic.query.filter_by().all()
        schema = DiagnosticSchema(many=True)
        usersObj = schema.dump(diagnostics)
        return jsonify(usersObj)
    
def changeValuesDiagnostic(diagnostic,data):
    
    diagnostic.nom = data['nom']
    diagnostic.date_debut = data['date_debut']
    diagnostic.date_fin= data['date_fin']

    return diagnostic

def getDiagnostic(diagnostic):
    schema = DiagnosticSchema(many=False)
    diagnosticObj = schema.dump(diagnostic)
    return jsonify(diagnosticObj)


    