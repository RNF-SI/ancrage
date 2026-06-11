from models.models import *
from schemas.metier import *
from routes.diagnostics import getDiagnostic
from routes import bp,request,json,current_app,secure_filename,send_from_directory,NotFound
from configs.logger_config import logger,os
from pypnusershub.decorators import check_auth

@bp.route('/diagnostic/upload', methods=['POST'])
@check_auth(1)
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

    logger.info(f"Recherche fichier :{full_path}")

    if not os.path.exists(full_path):
        return f"Fichier non trouvé : {filename}", 404

    return send_from_directory(upload_folder, filename)

def _build_renamed_filename(old_nom, new_base_name):
    raw = (new_base_name or '').strip()
    if not raw:
        return None

    if '.' in os.path.basename(raw):
        raw = os.path.splitext(raw)[0]

    new_base = secure_filename(raw)
    if not new_base:
        return None

    _, old_ext = os.path.splitext(old_nom)
    if old_ext:
        return secure_filename(f"{new_base}{old_ext}") or None
    return new_base


@bp.route('/diagnostic/document/<int:id_document>', methods=['PUT'])
@check_auth(1)
def update_document(id_document):
    data = request.get_json() or {}
    document = db.session.query(Document).get(id_document)
    if not document:
        raise NotFound(f"Document avec id {id_document} non trouvé.")

    new_nom = _build_renamed_filename(document.nom, data.get('nom', ''))
    if not new_nom:
        return jsonify({'error': 'Nom de fichier invalide'}), 400

    if new_nom == document.nom:
        diagnostic = Diagnostic.query.filter_by(id_diagnostic=document.diagnostic_id).first()
        return getDiagnostic(diagnostic)

    upload_folder = current_app.config['UPLOAD_FOLDER']
    old_path = os.path.join(upload_folder, document.nom)
    new_path = os.path.join(upload_folder, new_nom)

    if os.path.exists(new_path):
        return jsonify({'error': 'Un fichier avec ce nom existe déjà'}), 409

    if os.path.exists(old_path):
        try:
            os.rename(old_path, new_path)
        except OSError as exc:
            logger.error(f"Erreur lors du renommage du fichier : {exc}")
            return jsonify({'error': 'Erreur lors du renommage du fichier'}), 500

    document.nom = new_nom
    db.session.commit()

    diagnostic = Diagnostic.query.filter_by(id_diagnostic=document.diagnostic_id).first()
    return getDiagnostic(diagnostic)


@bp.route('/diagnostic/document/delete/<int:id_document>', methods=['DELETE'])
@check_auth(1)
def delete_document(id_document):
    # Récupération de l'entrée en base
    document = db.session.query(Document).get(id_document)
    id_diag = document.diagnostic_id

    diagnostic = Diagnostic.query.filter_by(id_diagnostic=id_diag).first()

    if not document:
        raise NotFound(f"Document avec id {id_document} non trouvé.")

    # Construction du chemin complet
    upload_folder = current_app.config['UPLOAD_FOLDER']
    filepath = os.path.join(upload_folder, document.nom)

    # Suppression du fichier s’il existe
    if os.path.exists(filepath):
        try:
            os.remove(filepath)
        except Exception as e:
            return logger.error({"error": f"Erreur lors de la suppression du fichier : {str(e)}"}), 500

    # Suppression de l’entrée en base
    db.session.delete(document)
    db.session.commit()

    return getDiagnostic(diagnostic)