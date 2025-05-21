from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from sqlalchemy import func
from sqlalchemy.orm import aliased
from routes import bp,date_time
from datetime import date, datetime

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
        raw_date = data.get('date_rapport')
        print(raw_date)
        if raw_date != None :
     
            date_rapport = datetime.strptime(raw_date, '%d/%m/%Y')
            diagnostic.is_read_only = True
            diagnostic.date_rapport = date_rapport
        """ print_diagnostic(diagnostic); """
        db.session.commit()
        return getDiagnostic(diagnostic)

    elif request.method == 'DELETE':

        db.session.delete(diagnostic)
        db.session.commit()
        return {"success": "Suppression terminée"}
    
def print_diagnostic(diagnostic):
    print("🔍 Diagnostic :")
    print(f"  ID              : {diagnostic.id_diagnostic}")
    print(f"  Nom             : {diagnostic.nom}")
    print(f"  Date début      : {diagnostic.date_debut}")
    print(f"  Date fin        : {diagnostic.date_fin}")
    print(f"  Date rapport    : {diagnostic.date_rapport}")
    print(f"  Créé par        : {diagnostic.created_by}")
    print(f"  Est en lecture seule : {diagnostic.is_read_only}")
    print(f"  Sites associés  : {[site.id_site for site in diagnostic.sites]}")
    print(f"  Acteurs associés: {[acteur.id_acteur for acteur in diagnostic.acteurs]}")

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

@bp.route('/diagnostics/charts/average/<id_diagnostic>')
def getAveragebyQuestion(id_diagnostic):
    # Aliases pour les différentes utilisations de Nomenclature
    ValeurReponse = aliased(Nomenclature)     # tn
    Categorie = aliased(Nomenclature)         # tn3
    Theme = aliased(Nomenclature)             # tn4

    
    query = (
        db.session.query(
            Theme.libelle.label("theme"),
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
        .filter(Diagnostic.id_diagnostic==id_diagnostic)
        .group_by(
            Theme.id_nomenclature,
            Question.id_question,
            Categorie.id_nomenclature
        )
        .order_by(Question.id_question)
    )

    results = query.all()
    data = [
        {
            "theme": r.theme,
            "question": r.question,
            "categorie": r.categorie_acteur,
            "moyenne": float(r.moyenne_score),
            "id_question":r.id_question
        }
        for r in results
    ]
    return jsonify(data)

@bp.route("/diagnostics/charts/repartition/<id_diagnostic>", methods=["GET"])
def get_reponses_par_theme(id_diagnostic):
    ValeurReponse = aliased(Nomenclature)
    Categorie = aliased(Nomenclature)
    Theme = aliased(Nomenclature)

    results = (
        db.session.query(
            Theme.libelle.label("theme"),
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
        .join(acteur_categorie, acteur_categorie.c.acteur_id == Acteur.id_acteur)
        .join(Categorie, Categorie.id_nomenclature == acteur_categorie.c.categorie_id)
        .filter(Diagnostic.id_diagnostic==id_diagnostic)
        .group_by(Theme.id_nomenclature, Question.id_question, ValeurReponse.value, ValeurReponse.libelle)
        .order_by(Question.id_question, ValeurReponse.value)
        .filter(Diagnostic.id_diagnostic==id_diagnostic)
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
            "id_question":r.id_question
        }
        for r in results
    ]

    return jsonify(output)

@bp.route('/diagnostic/structures/<int:id_diagnostic>', methods=['GET'])
def get_structures_by_diagnostic(id_diagnostic):

    structures = (
        db.session.query(Acteur.structure)
        .filter(Acteur.diagnostic_id == id_diagnostic)
        .filter(Acteur.structure.isnot(None))
        .distinct()
        .all()
    )

    structure_list = [s[0] for s in structures]

    return jsonify({'structures': structure_list})

@bp.route("/diagnostics/charts/radars/<int:id_diagnostic>", methods=["GET"])
def get_scores(id_diagnostic):
    diagnostic_id = id_diagnostic

    ValeurReponse = aliased(Nomenclature)
    Categorie = aliased(Nomenclature)
    Theme = aliased(Nomenclature)

    # Jointure ORM
    results = (
        db.session.query(
            func.avg(ValeurReponse.value).label("score"),
            Question.libelle_graphique.label("libelle_graphique"),
            Categorie.libelle.label("categorie"),
            Theme.libelle.label("theme")
        )
        .select_from(Diagnostic)  
        .join(Acteur, Diagnostic.id_diagnostic == Acteur.diagnostic_id)
        .join(Reponse, Acteur.id_acteur == Reponse.acteur_id)
        .join(ValeurReponse, Reponse.valeur_reponse_id == ValeurReponse.id_nomenclature)
        .join(Question, Reponse.question_id == Question.id_question)
        .join(Theme, Question.theme_id == Theme.id_nomenclature)
        .join(acteur_categorie, acteur_categorie.c.acteur_id == Acteur.id_acteur)
        .join(Categorie, Categorie.id_nomenclature == acteur_categorie.c.categorie_id)
        .filter(Diagnostic.id_diagnostic==id_diagnostic)
        .group_by(Question.id_question, Question.libelle_graphique,
                  Categorie.libelle, Theme.libelle)
        .order_by(Question.libelle_graphique)
        .all()
    )

    # Formatage JSON
    data = [
        {
            "score": round(r.score, 2) if r.score is not None else None,
            "libelle_graphique": r.libelle_graphique,
            "categorie": r.categorie,
            "theme": r.theme
        }
        for r in results
    ]

    return jsonify(data)
    
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
                    reponses=a.reponses,
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


    