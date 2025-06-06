from flask import request, jsonify, current_app, send_from_directory
from models.models import *
from schemas.metier import *
from sqlalchemy.orm import aliased
from routes import bp,now, slugify, uuid,func
from datetime import datetime
import os,json
from werkzeug.utils import secure_filename

@bp.route('/diagnostic/<int:id_diagnostic>/<slug>', methods=['GET','PUT'])
def diagnosticMethods(id_diagnostic,slug):
    diagnostic = Diagnostic.query.filter_by(id_diagnostic=id_diagnostic).first()
    
    if request.method == 'GET':
        if diagnostic.slug == slug:
            return getDiagnostic(diagnostic)
    
    
    elif request.method == 'PUT':
        if diagnostic.slug == slug:
            data = request.get_json()
            
            if 'acteurs' in data:
                print(f"Acteurs reçus ({len(data['acteurs'])}) :")
                for acteur in data['acteurs']:
                    print(f" - ID: {acteur.get('id_acteur')}, Nom: {acteur.get('nom')}")
            
            diagnostic = changeValuesDiagnostic(diagnostic,data)

            diagnostic.modified_at = now
            raw_date = data.get('date_rapport')
            if raw_date != None :
        
                date_rapport = datetime.strptime(raw_date, '%d/%m/%Y')
                diagnostic.is_read_only = True
                diagnostic.date_rapport = date_rapport
            db.session.commit()
            return getDiagnostic(diagnostic)
    
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
    diagnostic.nom=data['nom']
    diagnostic.created_at = now
    diagnostic.created_by = data['created_by']
    diagnostic.identite_createur = data['identite_createur']
    myuuid = uuid.uuid4()
    diagnostic.slug = slugify(diagnostic.nom) + '-' + str(myuuid)
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

    if not data or 'id_sites' not in data:
        return jsonify({'message': 'Aucun ID de site fourni.'}), 400

    sites_ids = data['id_sites']

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
        .filter(Diagnostic.id_diagnostic==id_diagnostic)
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
    return jsonify(data)

@bp.route("/diagnostics/charts/repartition/<id_diagnostic>", methods=["GET"])
def get_reponses_par_theme(id_diagnostic):
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
        .filter(Diagnostic.id_diagnostic==id_diagnostic)
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
        .filter(Diagnostic.id_diagnostic==id_diagnostic)
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

    return jsonify(data)

@bp.route('/diagnostic/mots-cles/<int:id_diagnostic>',methods=['GET'])
def get_afoms_par_mot_cle_et_diagnostic(id_diagnostic):
    afoms = (
        db.session.query(Afom)
        .join(MotCle)
        .filter(MotCle.diagnostic_id == id_diagnostic)
        .all()
    )

    data = []
    for afom in afoms:
        mot_cle = afom.mot_cle

        data.append({
            "id_afom": afom.id_afom,
            "nombre": afom.number,
            "mot_cle": {
                "id_mot_cle": mot_cle.id_mot_cle,
                "nom": mot_cle.nom,
                "mots_cles_issus": [
                    {
                        "id_mot_cle": enfant.id_mot_cle,
                        "nom": enfant.nom
                    }
                    for enfant in mot_cle.mots_cles_issus
                ],
                "categories": [
                    {
                        "id_nomenclature": cat.id_nomenclature,
                        "libelle": cat.libelle,
                        "value": cat.value
                    }
                    for cat in mot_cle.categories
                ],
            }
        })

    return jsonify(data)


@bp.route('/diagnostic/upload', methods=['POST'])
def create_documents():
    documents = json.loads(request.form['documents'])
    files = request.files.getlist("files")

    upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")

    # Créer le répertoire avec permissions 755 s’il n’existe pas
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder, mode=0o755, exist_ok=True)

    for doc in documents:
        nom = doc.get("nom")
        id_diagnostic = doc.get("diagnostic", {}).get("id_diagnostic")

        document = Document(
            nom=nom,
            diagnostic_id=id_diagnostic  
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
    diagnostic = Diagnostic.query.filter_by(id_diagnostic=id_diagnostic).first()
    return getDiagnostic(diagnostic)

@bp.route('/diagnostic/uploads/<path:filename>')
def uploaded_file(filename):
    filename = secure_filename(filename)
    upload_folder = current_app.config['UPLOAD_FOLDER']
    full_path = os.path.join(upload_folder, filename)

    print("Recherche fichier :", full_path)

    if not os.path.exists(full_path):
        return f"Fichier non trouvé : {filename}", 404

    return send_from_directory(upload_folder, filename)
    
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
                    created_at=now,
                    created_by=data['created_by'],
                    diagnostic_id=diagnostic.id_diagnostic,
                    categories=a.categories,
                    reponses=a.reponses,
                    slug=a.slug,
                    profil_cognitif_id=a.profil_cognitif_id,
                    statut_entretien=a.statut_entretien,
                    acteur_origine_id = a.acteur_origine_id if a.acteur_origine_id else a.id_acteur,
                    is_copy=True
                )
                db.session.add(new_acteur)
                copied_acteurs.append(new_acteur)

            diagnostic.acteurs = copied_acteurs

    return diagnostic

@bp.route('/diagnostic/afom/update',methods=['POST'])
def enregistrer_afoms():
    graph_data = request.get_json()

    try:
        diagnostic_id = graph_data[0]['mot_cle']['diagnostic']['id_diagnostic']
        print(diagnostic_id)
    except (KeyError, IndexError, TypeError):
        print("[ERREUR] Impossible d'extraire l'identifiant du diagnostic.")
        return {"error": "Données invalides"}, 400

    try:
        # Suppression des AFOM existants liés au diagnostic
        afom_ids_to_delete = (
            db.session.query(Afom.id_afom)
            .join(Afom.mot_cle)
            .filter(MotCle.diagnostic_id == diagnostic_id)
            .all()
        )
        ids = [id_tuple[0] for id_tuple in afom_ids_to_delete]
        if ids:
            db.session.query(Afom).filter(Afom.id_afom.in_(ids)).delete(synchronize_session=False)

        mots_cles_bdd = []
        groupes_attendus = []

        # Étape 1 : Création ou récupération des mots-clés et groupes
        for item in graph_data:
            mot_cle_data = item['mot_cle']
            nombre = item.get('nombre', 0)
            nom = mot_cle_data.get('nom')
            diagnostic_id = mot_cle_data.get('diagnostic', {}).get('id_diagnostic')
            categories = mot_cle_data.get('categories', [])
            enfants = mot_cle_data.get('mots_cles_issus', [])

            if not nom or not diagnostic_id:
                continue

            mc_existant = MotCle.query.filter_by(nom=nom, diagnostic_id=diagnostic_id).first()
            if not mc_existant:
                mc_existant = MotCle(nom=nom, diagnostic_id=diagnostic_id)
                db.session.add(mc_existant)
                db.session.flush()

            for cat in categories:
                cat_id = cat.get('id_nomenclature')
                if cat_id:
                    cat_obj = Nomenclature.query.get(cat_id)
                    if cat_obj and cat_obj not in mc_existant.categories:
                        mc_existant.categories.append(cat_obj)

            mots_cles_bdd.append((mc_existant, nombre))

            if enfants:
                groupes_attendus.append((mc_existant, enfants))

        # Étape 2 : Création des enfants et liaison aux groupes
        for parent_mc, enfants in groupes_attendus:
            for enfant_data in enfants:
                nom_enfant = enfant_data.get('nom')
                diag_id_enfant = enfant_data.get('diagnostic', {}).get('id_diagnostic')
                if not nom_enfant or not diag_id_enfant:
                    continue

                enfant = MotCle.query.filter_by(nom=nom_enfant, diagnostic_id=diag_id_enfant).first()
                if not enfant:
                    enfant = MotCle(nom=nom_enfant, diagnostic_id=diag_id_enfant)
                    db.session.add(enfant)
                    db.session.flush()

                enfant.mots_cles_groupe_id = parent_mc.id_mot_cle

        # Étape 3 : Création des AFOMs (mots_cles_bdd contient les couples (mot_clé, nombre))
        for mot_cle, nombre in mots_cles_bdd:
            afom = Afom(mot_cle_id=mot_cle.id_mot_cle, number=nombre)
            db.session.add(afom)

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        print(f"[ERREUR ENREGISTREMENT] {e}")
        return {"error": "Erreur serveur lors de l’enregistrement"}, 500

    return get_afoms_par_mot_cle_et_diagnostic(diagnostic_id)

    

def deleteActors(diagnostic_id):
     
    Acteur.query.filter(
        Acteur.diagnostic_id == diagnostic_id,
        Acteur.is_copy == True
    ).delete()

def getDiagnostic(diagnostic):
    schema = DiagnosticSchema(many=False)
    diagnosticObj = schema.dump(diagnostic)
    return jsonify(diagnosticObj)


    