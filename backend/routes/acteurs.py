from models.models import db
from flask import request, jsonify
from sqlalchemy.orm import joinedload, selectinload
from models.models import *
from schemas.metier import *
from routes import bp, datetime, slugify, uuid, timezone
from configs.logger_config import logger
from routes.reponses import verifDatesEntretien
from pypnusershub.decorators import check_auth


@bp.route('/acteur/<id_acteur>/<slug>', methods=['GET', 'PUT','DELETE']) # Vérifie l'authentification (bloque si non authentifié)
@check_auth(1)  # Vérifie le niveau de droit
def acteurMethods(id_acteur, slug):
    logger.info(f"🔍 Requête {request.method} pour l'acteur {id_acteur} avec slug '{slug}'")
    acteur = Acteur.query.filter_by(id_acteur=id_acteur).first()

    if not acteur:
        logger.info(f" Aucun acteur trouvé avec l'ID {id_acteur}")
        return jsonify({'error': 'Acteur non trouvé'}), 404

    if request.method == 'GET':
        if acteur.slug == slug:
            logger.info(" Slug valide - récupération des données de l'acteur")
            return getActeur(acteur)
        else:
            logger.info(" Slug invalide")
            return jsonify({'error': 'Slug invalide'}), 400

    elif request.method == 'PUT':
        if acteur.slug == slug:
            logger.info("✏ Mise à jour de l'acteur...")
            data = request.get_json()
            logger.info(f" Données reçues : {data}")
            acteur = changeValuesActeur(acteur, data)
            acteur.modified_at = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
            acteur.modified_by = data['modified_by']

            db.session.commit()
            logger.info(f"💾 Modifications enregistrées pour l'acteur {id_acteur}")
            return getActeur(acteur)
        else:
            logger.info(" Slug invalide pour mise à jour")
            return jsonify({'error': 'Slug invalide'}), 400
    else:
        if acteur.slug == slug:
            db.session.delete(acteur)
            db.session.commit()
            logger.info(f"🗑 Acteur {id_acteur} supprimé")
            return '', 204
        else:
            logger.warning("❌ Slug invalide pour suppression")
            return jsonify({'error': 'Slug invalide'}), 400

@bp.route('/acteur/', methods=['POST'])
def postActeur():
    if request.method == 'POST':
        logger.info(" Création d'un nouvel acteur")
        data = request.get_json()
        logger.info(f" Données reçues : {data}")

        acteur = Acteur()
        acteur = changeValuesActeur(acteur, data)

        logger.info(f"""✔ Données acteur mises à jour :
        - Nom        : {acteur.nom}
        - Prénom     : {acteur.prenom}
        - Fonction   : {acteur.fonction}
        - Téléphone  : {acteur.telephone}
        - Email      : {acteur.mail}
        - Commune ID : {acteur.commune_id}
        - Structure  : {acteur.structure}
        - Profil ID  : {acteur.profil_cognitif_id}
        """)

        acteur.created_at = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
        myuuid = uuid.uuid4()
        acteur.slug = slugify(acteur.nom) + '-' + str(myuuid)
        acteur.created_by = data.get('created_by', 'unknown')
        # Gérer le cas où diagnostic est None
        if data.get('diagnostic') is not None:
            acteur.diagnostic_id = data['diagnostic']['id_diagnostic']
        else:
            acteur.diagnostic_id = None
        db.session.add(acteur)
        db.session.commit()
        logger.info(f"✅ Acteur créé avec ID {acteur.id_acteur} et slug {acteur.slug}")
        return getActeur(acteur)

@bp.route('/acteur/state/<id_acteur>/<id_statut>', methods=['PUT'])
@check_auth(1)
def changeStateInterview(id_acteur, id_statut):
    logger.info(f"🔁 Changement de statut de l'acteur {id_acteur} vers {id_statut}")
    data = request.get_json()
    acteur = Acteur.query.filter_by(id_acteur=id_acteur).first()

    if not acteur:
        logger.info(f"❌ Acteur {id_acteur} non trouvé")
        return jsonify({'error': 'Acteur non trouvé'}), 404

    acteur.statut_entretien_id = id_statut
    acteur.modified_at = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
    acteur.modified_by = data['modified_by']

    db.session.add(acteur)
    db.session.commit()
    logger.info(f"✅ Statut mis à jour pour l'acteur {id_acteur}")
    verifDatesEntretien(acteur.diagnostic.id_diagnostic)
    return getActeur(acteur)

@bp.route('/acteurs/sites', methods=['POST'])
def getAllActeursBySites():
    logger.info("📡 Récupération des acteurs par sites")
    data = request.get_json()
    if data.get('id_sites'):
        liste = data['id_sites']
        exclude_diagnostic_id = data.get('exclude_diagnostic_id')
        logger.info(f"🧭 Liste des sites : {liste}, diagnostic exclu : {exclude_diagnostic_id}")

        diagnostics_query = (
            db.session.query(Diagnostic.id_diagnostic)
            .join(Diagnostic.sites)
            .filter(Site.id_site.in_(liste))
        )
        if exclude_diagnostic_id:
            diagnostics_query = diagnostics_query.filter(
                Diagnostic.id_diagnostic != exclude_diagnostic_id
            )
        diagnostics = diagnostics_query.distinct().all()
        ids_diagnostics = [d.id_diagnostic for d in diagnostics]
        logger.info(f"🔍 Diagnostics trouvés : {ids_diagnostics}")

        if not ids_diagnostics:
            logger.info("ℹ Aucun diagnostic trouvé pour ces sites")
            return jsonify([]), 200

        acteurs = (
            Acteur.query
            .filter(Acteur.diagnostic_id.in_(ids_diagnostics))
            .filter_by(is_deleted=False)
            .options(
                joinedload(Acteur.commune).joinedload(Commune.departement),
                selectinload(Acteur.categories),
                joinedload(Acteur.diagnostic)
            )
            .all()
        )
        logger.info(f"👥 Nombre d'acteurs trouvés : {len(acteurs)}")
        schema = ActeurImportSchema(many=True)
        return jsonify(schema.dump(acteurs)), 200
    else:
        logger.info("❌ Champ 'id_sites' manquant")
        return jsonify({'error': "Champ 'id_sites' requis"}), 400

@bp.route('/acteurs/diagnostic/<int:id_diagnostic>', methods=['GET'])
@check_auth(1)
def getAllActeursByDiag(id_diagnostic):
    acteurs = Acteur.query.filter_by(diagnostic_id=id_diagnostic).all()
    schema = ActeurLiteSchema(many=True)
    return jsonify(schema.dump(acteurs)), 200

@bp.route('/acteurs/<created_by>', methods=['GET'])
@check_auth(1)
def getAllActeursByUSer(created_by):
    logger.info(f"📋 Récupération des acteurs créés par : {created_by}")
    acteurs = Acteur.query.filter_by(created_by=created_by).all()
    logger.info(f"👤 Acteurs trouvés : {len(acteurs)}")
    schema = ActeurSchema(many=True)
    usersObj = schema.dump(acteurs)
    return jsonify(usersObj)

@bp.route('/acteur/disable/<int:id_acteur>/<slug>', methods=['PUT'])
@check_auth(1)
def disableActeur(id_acteur, slug):
    acteur = Acteur.query.filter_by(id_acteur=id_acteur).first()

    if not acteur:
        logger.warning(f"❌ Aucun acteur trouvé pour l'ID {id_acteur}")
        return jsonify({'error': 'Acteur non trouvé'}), 404
    
    if acteur.slug == slug:
        acteur.is_deleted = True
        db.session.commit()
        # L'objet acteur est déjà en mémoire, pas besoin de recharger
        return getActeur(acteur)
    else:
        logger.warning(f"❌ Slug invalide pour mise à jour de l'acteur {id_acteur}")
        return jsonify({'error': 'Slug invalide'}), 400

def changeValuesActeur(acteur, data):
    logger.info("🔄 Mise à jour des valeurs de l'acteur à partir des données fournies")
    acteur.nom = data['nom']
    acteur.prenom = data['prenom']
    acteur.fonction = data['fonction']
    acteur.telephone = data['telephone']
    acteur.mail = data['mail']
    acteur.commune_id = data['commune']['id_commune']
    acteur.structure = data['structure']
    acteur.is_deleted=False
    
    if 'profil' in data and data['profil']:
        acteur.profil_cognitif_id = data['profil']['id_nomenclature']

    new_cat_ids = {c['id_nomenclature'] for c in data['categories']}
    current_cats = {c.id_nomenclature for c in acteur.categories}

    for cat in acteur.categories[:]:
        if cat.id_nomenclature not in new_cat_ids:
            logger.info(f" Retrait de la catégorie {cat.id_nomenclature}")
            acteur.categories.remove(cat)

    # Optimisation : charger toutes les catégories en une seule requête
    cat_ids_list = list(new_cat_ids - current_cats)
    if cat_ids_list:
        cats = Nomenclature.query.filter(Nomenclature.id_nomenclature.in_(cat_ids_list)).all()
        for cat in cats:
            logger.info(f" Ajout de la catégorie {cat.id_nomenclature}")
            acteur.categories.append(cat)

    return acteur

def getActeur(acteur):
    logger.info(f"📤 Sérialisation de l'acteur {acteur.id_acteur}")
    schema = ActeurWithoutResponsesSchema(many=False)
    acteurObj = schema.dump(acteur)
    return jsonify(acteurObj)
