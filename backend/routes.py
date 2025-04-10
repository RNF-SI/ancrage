from app import db
from flask import Flask, request, Response, render_template, redirect, Blueprint, jsonify, g, abort, current_app
from models.models import *
from schemas.geo import *
from schemas.metier import *

bp = Blueprint('routes', __name__)

@bp.route('/site/<id_site>', methods=['GET','PUT','DELETE'])
def siteMethods(id_site):
    print(Site)
    site = Site.query.filter_by(id_site=id_site).first()
    
    if request.method == 'GET':

        schema = SiteSchema(many=False)
        siteObj = schema.dump(site)

        return jsonify(siteObj)

    """ if request.method == 'PUT':

        data = request.get_json()

        site.nom = data['nom']
        user.prenom = data['prenom']
        user.email = data['email']
        user.actif = data['actif']

        db.session.commit()
        return {"success": "Mise à jour validée"}

    if request.method == 'DELETE':

        db.session.delete(user)
        db.session.commit()
        return {"success": "Suppression terminée"}

#route pour récupérer les informations de l'ensemble des utilisateurs
@app.route('/users', methods=['GET'])
def getUsers():
    users = Users.query.filter_by(actif=True).all()
    schema = UsersSchema(many=True)
    usersObj = schema.dump(users)

    return jsonify(usersObj) """