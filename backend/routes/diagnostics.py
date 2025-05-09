from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp,date_time

@bp.route('/diagnostic/<int:id_diagnostic>', methods=['GET','PUT','DELETE'])
def diagnosticMethods(id_diagnostic):
    diagnostic = Diagnostic.query.filter_by(id_diagnostic=id_diagnostic).first()
    
    if request.method == 'GET':

       return getDiagnostic(diagnostic)
    
    
    elif request.method == 'PUT':
        data = request.get_json()
        
        if 'acteurs' in data:
            print(f"Acteurs reçus ({len(data['acteurs'])}) :")
            for acteur in data['acteurs']:
                print(f" - ID: {acteur.get('id_acteur')}, Nom: {acteur.get('nom')}")
        
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
    data = request.get_json()

    diagnostic = Diagnostic()
    
    diagnostic.created_at = date_time
    diagnostic.created_by = data['created_by']
    diagnostic.identite_createur = data['identite_createur']
    db.session.add(diagnostic)
    diagnostic = changeValuesDiagnostic(diagnostic, data)
    db.session.flush()  # Pour obtenir l'id_diagnostic sans commit immédiat

    # Associer les acteurs transmis
   
    db.session.commit()
    return getDiagnostic(diagnostic)

@bp.route('/diagnostics',methods=['GET'])
def getAllDiagnostics():
    if request.method == 'GET': 
        
        diagnostics = Diagnostic.query.filter_by().all()
        schema = DiagnosticSchema(many=True)
        usersObj = schema.dump(diagnostics)
        return jsonify(usersObj)
    
@bp.route('/diagnostics-site', methods=['POST'])
def getAllDiagnosticsBySites():
    data = request.get_json()

    if not data or 'site_ids' not in data:
        return jsonify({'message': 'Aucun ID de site fourni.'}), 400

    sites_ids = data['site_ids']

    filtered_diagnostics = (
        Diagnostic.query
        .join(Diagnostic.sites)
        .join(Diagnostic.acteurs)
        .filter(Site.id_site.in_(sites_ids))
        .distinct()
        .all()
    )

    print("Diagnostics filtrés :", [f"id={d.id_diagnostic}, nom={d.nom}" for d in filtered_diagnostics])
    schema = DiagnosticSchema(many=True)
    return jsonify(schema.dump(filtered_diagnostics))

    
def changeValuesDiagnostic(diagnostic,data):
    
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
            print(f"Site ID {site_id} not found in database.")

    if 'acteurs' in data:
        
        new_actors_ids = {a['id_acteur'] for a in data['acteurs']}
        acteurs_orig = Acteur.query.filter(Acteur.id_acteur.in_(new_actors_ids)).all()
        
        deleteActors(diagnostic.id_diagnostic)

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
                    is_acteur_economique=a.is_acteur_economique,
                    structure=a.structure,
                    created_at=date_time,
                    created_by=data['created_by'],
                    diagnostic_id=diagnostic.id_diagnostic,
                    categories=a.categories,
                    questions=a.questions,
                    statut_entretien=a.statut_entretien,
                    acteur_origine_id = a.acteur_origine_id if a.acteur_origine_id else a.id_acteur,
                    is_copy=True
                )
                db.session.add(new_acteur)
                copied_acteurs.append(new_acteur)

            diagnostic.acteurs = copied_acteurs

    return diagnostic

def deleteActors(diagnostic_id):
     
    Acteur.query.filter(
        Acteur.diagnostic_id == diagnostic_id,
        Acteur.is_copy == True
    ).delete()

def getDiagnostic(diagnostic):
    schema = DiagnosticSchema(many=False)
    diagnosticObj = schema.dump(diagnostic)
    return jsonify(diagnosticObj)


    