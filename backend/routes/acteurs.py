from models.models import db
from flask import request, jsonify
from models.models import *
from schemas.metier import *
from routes import bp, now, slugify, uuid
from routes.logger_config import logger

@bp.route('/acteur/<id_acteur>/<slug>', methods=['GET', 'PUT'])
def acteurMethods(id_acteur, slug):
    logger.info(f"🔍 Requête {request.method} pour l'acteur {id_acteur} avec slug '{slug}'")
    acteur = Acteur.query.filter_by(id_acteur=id_acteur).first()

    if not acteur:
        logger.info(f"❌ Aucun acteur trouvé avec l'ID {id_acteur}")
        return jsonify({'error': 'Acteur non trouvé'}), 404

    if request.method == 'GET':
        if acteur.slug == slug:
            logger.info("✅ Slug valide - récupération des données de l'acteur")
            return getActeur(acteur)
        else:
            logger.info("❌ Slug invalide")
            return jsonify({'error': 'Slug invalide'}), 400

    elif request.method == 'PUT':
        if acteur.slug == slug:
            logger.info("✏ Mise à jour de l'acteur...")
            data = request.get_json()
            logger.info(f"📦 Données reçues : {data}")
            acteur = changeValuesActeur(acteur, data)
            acteur.modified_at = now
            acteur.modified_by = data['modified_by']

            db.session.commit()
            logger.info(f"💾 Modifications enregistrées pour l'acteur {id_acteur}")
            return getActeur(acteur)
        else:
            logger.info("❌ Slug invalide pour mise à jour")
            return jsonify({'error': 'Slug invalide'}), 400

@bp.route('/acteur/', methods=['POST'])
def postActeur():
    if request.method == 'POST':
        logger.info("📥 Création d'un nouvel acteur")
        data = request.get_json()
        logger.info(f"📦 Données reçues : {data}")

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

        acteur.created_at = now
        myuuid = uuid.uuid4()
        acteur.slug = slugify(acteur.nom) + '-' + str(myuuid)
        acteur.created_by = data.get('created_by', 'unknown')
        acteur.diagnostic_id = data['diagnostic']['id_diagnostic']
        db.session.add(acteur)
        db.session.commit()
        logger.info(f"✅ Acteur créé avec ID {acteur.id_acteur} et slug {acteur.slug}")
        return getActeur(acteur)

@bp.route('/acteur/state/<id_acteur>/<id_statut>', methods=['PUT'])
def changeStateInterview(id_acteur, id_statut):
    logger.info(f"🔁 Changement de statut de l'acteur {id_acteur} vers {id_statut}")
    data = request.get_json()
    acteur = Acteur.query.filter_by(id_acteur=id_acteur).first()

    if not acteur:
        logger.info(f"❌ Acteur {id_acteur} non trouvé")
        return jsonify({'error': 'Acteur non trouvé'}), 404

    acteur.statut_entretien_id = id_statut
    acteur.modified_at = now
    acteur.modified_by = data['modified_by']

    db.session.add(acteur)
    db.session.commit()
    logger.info(f"✅ Statut mis à jour pour l'acteur {id_acteur}")
    return getActeur(acteur)

@bp.route('/acteurs/sites', methods=['POST'])
def getAllActeursBySites():
    logger.info("📡 Récupération des acteurs par sites")
    data = request.get_json()
    if data.get('id_sites'):
        liste = data['id_sites']
        logger.info(f"🧭 Liste des sites : {liste}")

        diagnostics = db.session.query(Diagnostic.id_diagnostic).\
            join(Diagnostic.sites).\
            filter(Site.id_site.in_(liste)).\
            distinct().all()
        ids_diagnostics = [d.id_diagnostic for d in diagnostics]
        logger.info(f"🔍 Diagnostics trouvés : {ids_diagnostics}")

        if not ids_diagnostics:
            logger.info("ℹ Aucun diagnostic trouvé pour ces sites")
            return jsonify([]), 200

        acteurs = Acteur.query.filter(Acteur.diagnostic_id.in_(ids_diagnostics)).all()
        logger.info(f"👥 Nombre d'acteurs trouvés : {len(acteurs)}")
        schema = ActeurSchema(many=True)
        return jsonify(schema.dump(acteurs)), 200
    else:
        logger.info("❌ Champ 'id_sites' manquant")
        return jsonify({'error': "Champ 'id_sites' requis"}), 400

@bp.route('/acteurs/<created_by>', methods=['GET'])
def getAllActeursByUSer(created_by):
    logger.info(f"📋 Récupération des acteurs créés par : {created_by}")
    acteurs = Acteur.query.filter_by(created_by=created_by).all()
    logger.info(f"👤 Acteurs trouvés : {len(acteurs)}")
    schema = ActeurSchema(many=True)
    usersObj = schema.dump(acteurs)
    return jsonify(usersObj)

def changeValuesActeur(acteur, data):
    logger.info("🔄 Mise à jour des valeurs de l'acteur à partir des données fournies")
    acteur.nom = data['nom']
    acteur.prenom = data['prenom']
    acteur.fonction = data['fonction']
    acteur.telephone = data['telephone']
    acteur.mail = data['mail']
    acteur.commune_id = data['commune']['id_commune']
    acteur.structure = data['structure']
    if 'profil' in data and data['profil']:
        acteur.profil_cognitif_id = data['profil']['id_nomenclature']

    new_cat_ids = {c['id_nomenclature'] for c in data['categories']}
    current_cats = {c.id_nomenclature for c in acteur.categories}

    for cat in acteur.categories[:]:
        if cat.id_nomenclature not in new_cat_ids:
            logger.info(f"🗑 Retrait de la catégorie {cat.id_nomenclature}")
            acteur.categories.remove(cat)

    for cat_id in new_cat_ids - current_cats:
        logger.info(f"➕ Ajout de la catégorie {cat_id}")
        join = Nomenclature.query.filter_by(id_nomenclature=cat_id).first()
        acteur.categories.append(join)

    return acteur

def getActeur(acteur):
    logger.info(f"📤 Sérialisation de l'acteur {acteur.id_acteur}")
    schema = ActeurWithoutResponsesSchema(many=False)
    acteurObj = schema.dump(acteur)
    return jsonify(acteurObj)
