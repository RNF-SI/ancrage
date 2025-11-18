from models.models import *
from schemas.metier import *
from routes.diagnostics import getDiagnostic
from routes import bp,request,json,current_app,secure_filename,send_from_directory,NotFound
from configs.logger_config import logger,os
from pypnusershub.decorators import check_auth

@check_auth(1)
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

    logger.info(f"Recherche fichier :{full_path}")

    if not os.path.exists(full_path):
        return f"Fichier non trouvé : {filename}", 404

    return send_from_directory(upload_folder, filename)

@check_auth(1)
@bp.route('/diagnostic/document/delete/<int:id_document>', methods=['DELETE'])
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