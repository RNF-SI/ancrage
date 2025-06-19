from flask import request, jsonify, current_app, send_from_directory
from models.models import *
from schemas.metier import *
from sqlalchemy.orm import aliased
from routes import bp,now, slugify, uuid,func
from datetime import datetime
import json
from werkzeug.utils import secure_filename
from routes.logger_config import os,logger
from backend.services.diagnostic_service import DiagnosticService

# Instancier le service (mais on garde la logique complexe intacte)
diagnostic_service = DiagnosticService()

@bp.route('/diagnostic/<int:id_diagnostic>/<slug>', methods=['GET','PUT'])
def diagnosticMethods(id_diagnostic, slug):
    """Gestion diagnostic par ID et slug - REFACTORISÉ gestion erreurs"""
    from backend.error_handlers import NotFound, BadRequest
    
    diagnostic = Diagnostic.query.filter_by(id_diagnostic=id_diagnostic).first()

    if not diagnostic:
        logger.warning(f"❌ Aucun diagnostic trouvé pour l'ID {id_diagnostic}")
        raise NotFound('Diagnostic non trouvé')

    if request.method == 'GET':
        if diagnostic.slug == slug:
            return getDiagnostic(diagnostic)
        else:
            logger.warning(f"❌ Slug invalide pour diagnostic {id_diagnostic}")
            raise BadRequest('Slug invalide')

    elif request.method == 'PUT':
        if diagnostic.slug == slug:
            data = request.get_json()

            if 'acteurs' in data:
                logger.info(f"Acteurs reçus ({len(data['acteurs'])}) :")
                for acteur in data['acteurs']:
                    logger.info(f" - ID: {acteur.get('id_acteur')}, Nom: {acteur.get('nom')}")

            diagnostic = diagnostic_service.update_diagnostic_values(diagnostic, data)
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
            raise BadRequest('Slug invalide')
    
# Fonction déplacée vers DiagnosticService.print_diagnostic_info()

@bp.route('/diagnostic',methods=['POST'])
def postDiagnostic():
    """Crée un diagnostic - AMÉLIORATION : validation JSON"""
    from backend.error_handlers import validate_json_request
    
    try:
        data = validate_json_request(request)
    except Exception as e:
        diagnostic_service.logger.error(f"Erreur validation JSON: {str(e)}")
        return {"message": "Données JSON invalides"}, 400

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
    """Liste tous les diagnostics - REFACTORISÉ"""
    if request.method == 'GET': 
        return jsonify(diagnostic_service.get_all())
    
@bp.route('/diagnostics-site', methods=['POST'])
def getAllDiagnosticsBySites():
    """Diagnostics par sites - AMÉLIORATION : validation JSON"""
    from backend.error_handlers import validate_json_request
    
    try:
        data = validate_json_request(request)
    except Exception as e:
        diagnostic_service.logger.error(f"Erreur validation JSON: {str(e)}")
        return {"message": "Données JSON invalides"}, 400

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
    """Calcule moyennes par question - REFACTORISÉ"""
    return jsonify(diagnostic_service.get_average_by_question(id_diagnostic))

@bp.route("/diagnostics/charts/repartition/<id_diagnostic>", methods=["GET"])
def get_reponses_par_theme(id_diagnostic):
    """Calcule répartition par thème - REFACTORISÉ"""
    return jsonify(diagnostic_service.get_reponses_par_theme(id_diagnostic))

@bp.route('/diagnostic/structures/<int:id_diagnostic>', methods=['GET'])
def get_structures_by_diagnostic(id_diagnostic):
    return jsonify(diagnostic_service.get_structures_by_diagnostic(id_diagnostic))

@bp.route("/diagnostics/charts/radars/<int:id_diagnostic>", methods=["GET"])
def get_scores(id_diagnostic):
    return jsonify(diagnostic_service.get_scores_radar(id_diagnostic))


@bp.route('/diagnostic/upload', methods=['POST'])
def create_documents():
    """Upload documents - REFACTORISÉ"""
    documents = json.loads(request.form['documents'])
    files = request.files.getlist("files")
    
    result = diagnostic_service.create_documents(documents, files)
    return jsonify(result)

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
    
# Fonction déplacée vers DiagnosticService.update_diagnostic_values()

@bp.route('/diagnostic/afom/update', methods=['POST'])
def enregistrer_afoms():
    """Met à jour les AFOM - AMÉLIORATION : validation JSON"""
    from backend.error_handlers import validate_json_request
    
    try:
        graph_data = validate_json_request(request)
    except Exception as e:
        diagnostic_service.logger.error(f"Erreur validation JSON: {str(e)}")
        return {"message": "Données JSON invalides"}, 400

    try:
        diagnostic_id = graph_data[0]['mot_cle']['diagnostic']['id_diagnostic']
        logger.info(f"[INFO] Diagnostic ID : {diagnostic_id}")
    except (KeyError, IndexError, TypeError):
        logger.error("[ERREUR] Impossible d'extraire l'identifiant du diagnostic.")
        return {"error": "Données invalides"}, 400

    try:
        # 🔥 Étape 0 : suppression des AFOM liés au diagnostic
        afom_ids = (
            db.session.query(Afom.id_afom)
            .join(MotCle)
            .filter(MotCle.diagnostic_id == diagnostic_id)
            .all()
        )
        ids = [row.id_afom for row in afom_ids]
        if ids:
            db.session.query(Afom).filter(Afom.id_afom.in_(ids)).delete(synchronize_session=False)

        # 🔁 Étape 0bis : collecter les id_mot_cle encore utilisés (parents + enfants)
        ids_a_conserver = set()
        for item in graph_data:
            mot_cle_data = item.get('mot_cle', {})
            id_parent = mot_cle_data.get('id_mot_cle')
            if isinstance(id_parent, int) and id_parent > 0:
                ids_a_conserver.add(id_parent)

            enfants = mot_cle_data.get('mots_cles_issus', [])
            for enfant in enfants:
                id_enfant = enfant.get('id_mot_cle')
                if isinstance(id_enfant, int) and id_enfant > 0:
                    ids_a_conserver.add(id_enfant)

        # 🔧 Étape 0ter : désactivation sélective des anciens mots-clés non présents dans le JSON
        db.session.query(MotCle).filter(
            MotCle.diagnostic_id == diagnostic_id,
            ~MotCle.id_mot_cle.in_(ids_a_conserver)
        ).update({MotCle.is_actif: False}, synchronize_session=False)

        db.session.flush()

        parents_temp = []

        # 🔁 Étape 1 : création des groupes (parents)
        for item in graph_data:
            mot_cle_data = item['mot_cle']
            nombre = item.get('nombre', 1)
            nom = mot_cle_data.get('nom')
            diagnostic_id = mot_cle_data.get('diagnostic', {}).get('id_diagnostic')
            categorie_data = mot_cle_data.get('categorie')
            enfants = mot_cle_data.get('mots_cles_issus', [])
            id_parent = mot_cle_data.get('id_mot_cle')

            if not nom or not diagnostic_id:
                continue

            categorie_id = None
            if isinstance(categorie_data, dict):
                categorie_id = categorie_data.get('id_nomenclature')

            if isinstance(id_parent, int) and id_parent > 0:
                parent = db.session.get(MotCle, id_parent)
                if parent:
                    parent.is_actif = True
                    parent.nom = nom  # mise à jour possible
                    parent.categorie_id = categorie_id
                    parent.mots_cles_groupe_id = None  # c'est un groupe
                else:
                    logger.warning(f"[AVERTISSEMENT] Mot-clé parent ID {id_parent} introuvable.")
                    continue
            else:
                parent = MotCle(
                    nom=nom,
                    diagnostic_id=diagnostic_id,
                    categorie_id=categorie_id,
                    is_actif=True
                )
                db.session.add(parent)
                db.session.flush()

            parents_temp.append((parent, enfants, nombre))
            logger.info(f"[GROUPE] Groupe traité : '{parent.nom}' (ID {parent.id_mot_cle})")

        # 👶 Étape 2 : création ou mise à jour des enfants
        for parent_mc, enfants, _ in parents_temp:
            for enfant_data in enfants:
                nom_enfant = enfant_data.get('nom')
                diag_enfant_id = enfant_data.get('diagnostic', {}).get('id_diagnostic')
                id_enfant = enfant_data.get('id_mot_cle')

                if not nom_enfant or not diag_enfant_id:
                    continue

                if isinstance(id_enfant, int) and id_enfant > 0:
                    enfant = db.session.get(MotCle, id_enfant)
                    if enfant:
                        enfant.nom = nom_enfant  # mise à jour
                        enfant.diagnostic_id = diag_enfant_id
                        enfant.mots_cles_groupe_id = parent_mc.id_mot_cle
                        enfant.is_actif = True
                    else:
                        logger.warning(f"[AVERTISSEMENT] Enfant ID {id_enfant} introuvable.")
                        continue
                else:
                    enfant = MotCle(
                        nom=nom_enfant,
                        diagnostic_id=diag_enfant_id,
                        mots_cles_groupe_id=parent_mc.id_mot_cle,
                        is_actif=True
                    )
                    db.session.add(enfant)

                logger.info(f"→ Enfant '{nom_enfant}' lié au groupe '{parent_mc.nom}'")

        db.session.flush()

        # ✅ Étape 3 : création des AFOMs
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

# Fonction déplacée vers DiagnosticService.delete_actors()

def getDiagnostic(diagnostic):
    """Helper de sérialisation - REFACTORISÉ"""
    return jsonify(diagnostic_service.serialize(diagnostic))


    