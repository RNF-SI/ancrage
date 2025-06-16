from flask import request, jsonify, current_app, send_from_directory
from models.models import *
from schemas.metier import *
from sqlalchemy.orm import aliased
from routes import bp,now, slugify, uuid,func
from datetime import datetime
import json
from werkzeug.utils import secure_filename
from routes.logger_config import os,logger

@bp.route('/diagnostic/<int:id_diagnostic>/<slug>', methods=['GET','PUT'])
def diagnosticMethods(id_diagnostic, slug):
    diagnostic = Diagnostic.query.filter_by(id_diagnostic=id_diagnostic).first()

    if not diagnostic:
        logger.warning(f"❌ Aucun diagnostic trouvé pour l'ID {id_diagnostic}")
        return jsonify({'error': 'Diagnostic non trouvé'}), 404

    if request.method == 'GET':
        if diagnostic.slug == slug:
            return getDiagnostic(diagnostic)
        else:
            logger.warning(f"❌ Slug invalide pour diagnostic {id_diagnostic}")
            return jsonify({'error': 'Slug invalide'}), 400

    elif request.method == 'PUT':
        if diagnostic.slug == slug:
            data = request.get_json()

            if 'acteurs' in data:
                logger.info(f"Acteurs reçus ({len(data['acteurs'])}) :")
                for acteur in data['acteurs']:
                    logger.info(f" - ID: {acteur.get('id_acteur')}, Nom: {acteur.get('nom')}")

            diagnostic = changeValuesDiagnostic(diagnostic, data)
            diagnostic.modified_at = now
            raw_date = data.get('date_rapport')
            print(raw_date)
            if raw_date is not None:
                date_rapport = datetime.strptime(raw_date, '%d/%m/%Y')
                print(date_rapport)
                diagnostic.is_read_only = True
                diagnostic.date_rapport = date_rapport

            db.session.commit()
            return getDiagnostic(diagnostic)
        else:
            logger.warning(f"❌ Slug invalide pour mise à jour du diagnostic {id_diagnostic}")
            return jsonify({'error': 'Slug invalide'}), 400
    
def print_diagnostic(diagnostic):
    logger.info("🔍 Diagnostic :")
    logger.info(f"  ID              : {diagnostic.id_diagnostic}")
    logger.info(f"  Nom             : {diagnostic.nom}")
    logger.info(f"  Date début      : {diagnostic.date_debut}")
    logger.info(f"  Date fin        : {diagnostic.date_fin}")
    logger.info(f"  Date rapport    : {diagnostic.date_rapport}")
    logger.info(f"  Créé par        : {diagnostic.created_by}")
    logger.info(f"  Est en lecture seule : {diagnostic.is_read_only}")
    logger.info(f"  Sites associés  : {[site.id_site for site in diagnostic.sites]}")
    logger.info(f"  Acteurs associés: {[acteur.id_acteur for acteur in diagnostic.acteurs]}")

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

    logger.info("Diagnostics filtrés :", [f"id={d.id_diagnostic}, nom={d.nom}" for d in filtered_diagnostics])
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

    logger.info("Recherche fichier :", full_path)

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
            logger.info(f"Site ID {site_id} not found in database.")

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
                    slug=a.slug,
                    profil_cognitif_id=a.profil_cognitif_id,
                    acteur_origine_id = a.acteur_origine_id if a.acteur_origine_id else a.id_acteur,
                    is_copy=True
                )
                db.session.add(new_acteur)
                copied_acteurs.append(new_acteur)

            diagnostic.acteurs = copied_acteurs

    return diagnostic

@bp.route('/diagnostic/afom/update', methods=['POST'])
def enregistrer_afoms():
    graph_data = request.get_json()

    try:
        diagnostic_id = graph_data[0]['mot_cle']['diagnostic']['id_diagnostic']
        logger.info(f"[INFO] Diagnostic ID : {diagnostic_id}")
    except (KeyError, IndexError, TypeError):
        logger.error("[ERREUR] Impossible d'extraire l'identifiant du diagnostic.")
        return {"error": "Données invalides"}, 400

    try:
        afom_ids = (
            db.session.query(Afom.id_afom)
            .join(MotCle)
            .filter(MotCle.diagnostic_id == diagnostic_id)
            .all()
        )
        ids = [row.id_afom for row in afom_ids]
        if ids:
            db.session.query(Afom).filter(Afom.id_afom.in_(ids)).delete(synchronize_session=False)
        db.session.query(MotCle).filter_by(diagnostic_id=diagnostic_id).update({MotCle.is_actif: False}, synchronize_session=False)
        db.session.flush()

        parents_temp = []

        # 🔁 Étape 1 : création des groupes sans tentative de réutilisation
        for item in graph_data:
            mot_cle_data = item['mot_cle']
            nombre = item.get('nombre', 1)
            nom = mot_cle_data.get('nom')
            diagnostic_id = mot_cle_data.get('diagnostic', {}).get('id_diagnostic')
            categorie_data = mot_cle_data.get('categorie')
            enfants = mot_cle_data.get('mots_cles_issus', [])

            if not nom or not diagnostic_id:
                continue

            categorie_id = None
            if isinstance(categorie_data, dict):
                categorie_id = categorie_data.get('id_nomenclature')

            nouveau_parent = MotCle(
                nom=nom,
                diagnostic_id=diagnostic_id,
                categorie_id=categorie_id,
                is_actif=True
            )
            db.session.add(nouveau_parent)
            db.session.flush()  # 🔐 assure l’ID du parent
            parents_temp.append((nouveau_parent, enfants, nombre))
            logger.info(f"[GROUPE] Nouveau groupe ajouté : '{nom}' (ID {nouveau_parent.id_mot_cle})")

        # 👶 Étape 2 : enfants liés à chaque groupe
        for parent_mc, enfants, _ in parents_temp:
            for enfant_data in enfants:
                nom_enfant = enfant_data.get('nom')
                diag_enfant_id = enfant_data.get('diagnostic', {}).get('id_diagnostic')

                if not nom_enfant or not diag_enfant_id:
                    continue

                enfant = MotCle(
                    nom=nom_enfant,
                    diagnostic_id=diag_enfant_id,
                    mots_cles_groupe_id=parent_mc.id_mot_cle,
                    is_actif=True
                )
                db.session.add(enfant)
                logger.info(f"→ Enfant '{nom_enfant}' ajouté au groupe '{parent_mc.nom}'")

        db.session.flush()

        # ✅ Étape 3 : création des AFOMs pour chaque groupe parent
        for parent_mc, _, nombre in parents_temp:
            afom = Afom(mot_cle_id=parent_mc.id_mot_cle, number=nombre)
            db.session.add(afom)

        db.session.commit()
        logger.info("[SUCCÈS] Tous les groupes et enfants ont été enregistrés.")
        return get_afoms_par_mot_cle_et_diagnostic(diagnostic_id)

    except Exception as e:
        db.session.rollback()
        logger.error(f"[ERREUR ENREGISTREMENT] {e}")
        return {"error": "Erreur serveur lors de l’enregistrement"}, 500
    

@bp.route('/diagnostic/mots-cles/<int:id_diagnostic>', methods=['GET'])
def get_afoms_par_mot_cle_et_diagnostic(id_diagnostic):
    # Création d’un alias pour rendre les jointures explicites
    mc_alias = aliased(MotCle)
    cat_alias = aliased(Nomenclature)

    results = (
        db.session.query(
            func.min(mc_alias.id_mot_cle).label("id_mot_cle"),
            mc_alias.nom.label("nom"),
            func.sum(Afom.number).label("nombre"),
            cat_alias.id_nomenclature.label("cat_id"),
            cat_alias.libelle.label("cat_libelle"),
            cat_alias.value.label("cat_value"),
            cat_alias.mnemonique.label("cat_mnemonique")
        )
        .join(mc_alias, Afom.mot_cle)
        .join(cat_alias, mc_alias.categorie)
        .filter(
            mc_alias.diagnostic_id == id_diagnostic,
            mc_alias.is_actif == True  # ✅ bon champ, bon alias
        )
        .group_by(
            mc_alias.nom,
            cat_alias.id_nomenclature,
            cat_alias.libelle,
            cat_alias.value,
            cat_alias.mnemonique
        )
        .order_by(cat_alias.libelle, mc_alias.nom)
        .all()
    )
    data = []
    for row in results:
        motcle_obj = db.session.get(MotCle, row.id_mot_cle)

        data.append({
            "id_afom": None,
            "nombre": row.nombre,
            "mot_cle": {
                "id_mot_cle": row.id_mot_cle,
                "nom": row.nom,
                "mots_cles_issus": [
                    {
                        "id_mot_cle": enfant.id_mot_cle,
                        "nom": enfant.nom
                    } for enfant in motcle_obj.mots_cles_issus
                ] if motcle_obj else [],
                "categorie": {
                    "id_nomenclature": row.cat_id,
                    "libelle": row.cat_libelle,
                    "value": row.cat_value,
                    "mnemonique": row.cat_mnemonique
                }
            }
        })

    return jsonify(data)   

def deleteActors(diagnostic_id):
     
    Acteur.query.filter(
        Acteur.diagnostic_id == diagnostic_id,
        Acteur.is_copy == True
    ).delete()

def getDiagnostic(diagnostic):
    schema = DiagnosticSchema(many=False)
    diagnosticObj = schema.dump(diagnostic)
    return jsonify(diagnosticObj)


    