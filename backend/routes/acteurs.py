from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp,now,slugify,uuid

@bp.route('/acteur/<id_acteur>/<slug>', methods=['GET','PUT'])
def acteurMethods(id_acteur,slug):
    acteur = Acteur.query.filter_by(id_acteur=id_acteur).first()
   
    if request.method == 'GET':
        if acteur.slug == slug:
            return getActeur(acteur)
    
    
    elif request.method == 'PUT':
        if acteur.slug == slug:
            data = request.get_json()
            acteur = changeValuesActeur(acteur,data)
            acteur.modified_at = now
            acteur.modified_by = data['modified_by']

            db.session.commit()
            return getActeur(acteur)
    
@bp.route('/acteur/',methods=['POST'])
def postActeur():
    if request.method == 'POST': 
        
        data = request.get_json()
    
        acteur=Acteur()
        acteur = changeValuesActeur(acteur,data)
        print(f"""✔ Données acteur mises à jour :
        - Nom        : {acteur.nom}
        - Prénom     : {acteur.prenom}
        - Fonction   : {acteur.fonction}
        - Téléphone  : {acteur.telephone}
        - Email      : {acteur.mail}
        - Commune ID : {acteur.commune_id}
        - Structure  : {acteur.structure}
        - Profil ID  : {acteur.profil_cognitif_id}
        """)
        acteur.created_at = now
        myuuid = uuid.uuid4()
        acteur.slug = slugify(acteur.nom) + '-' + str(myuuid)
        acteur.created_by = data.get('created_by', 'unknown')
        db.session.add(acteur)
        db.session.commit()
        return getActeur(acteur)
    
@bp.route('/acteur/state/<id_acteur>/<id_statut>',methods=['PUT'])
def changeStateInterview(id_acteur,id_statut):
    if request.method == 'PUT': 
        data = request.get_json()
        acteur = Acteur.query.filter_by(id_acteur=id_acteur).first()
        acteur.statut_entretien_id = id_statut
        acteur.modified_at = now
        acteur.modified_by = data['modified_by']
        db.session.add(acteur)
        db.session.commit()
        return getActeur(acteur)

@bp.route('/acteurs/sites',methods=['POST'])
def getAllActeursBySites():
    if request.method == 'POST': 
        data = request.get_json()
        if(data['id_sites']):
            liste=data['id_sites']
            # Récupère les diagnostics liés aux sites
            diagnostics = db.session.query(Diagnostic.id_diagnostic).\
                join(Diagnostic.sites).\
                filter(Site.id_site.in_(liste)).\
                distinct().all()

            ids_diagnostics = [d.id_diagnostic for d in diagnostics]

            if not ids_diagnostics:
                return jsonify([]), 200

            # Récupère les acteurs liés à ces diagnostics
            acteurs = Acteur.query.filter(Acteur.diagnostic_id.in_(ids_diagnostics)).all()

            schema = ActeurSchema(many=True)
            return jsonify(schema.dump(acteurs)), 200
    
@bp.route('/acteurs/<created_by>',methods=['GET'])
def getAllActeursByUSer(created_by):
    if request.method == 'GET': 
        
        acteurs = Acteur.query.filter_by(created_by=created_by).all()
        schema = ActeurSchema(many=True)
        usersObj = schema.dump(acteurs)
        return jsonify(usersObj)
    
def changeValuesActeur(acteur,data):
    
    acteur.nom = data['nom']
    acteur.prenom = data['prenom']
    acteur.fonction = data['fonction']
    acteur.telephone = data['telephone']
    acteur.mail = data['mail']
    acteur.commune_id = data['commune']['id_commune']
    acteur.structure = data['structure'] 
    acteur.profil_cognitif_id = data['profil']['id_nomenclature']
    new_cat_ids = {c['id_nomenclature'] for c in data['categories']}
    current_cats = {c.id_nomenclature for c in acteur.categories}

    for cat in acteur.categories[:]:
        if cat.id_nomenclature not in new_cat_ids:
            acteur.categories.remove(cat)

    for cat_id in new_cat_ids - current_cats:
        join = Nomenclature.query.filter_by(id_nomenclature=cat_id).first()
        acteur.categories.append(join)

    return acteur

def getActeur(acteur):
    schema = ActeurSchema(many=False)
    acteurObj = schema.dump(acteur)
    return jsonify(acteurObj)


    