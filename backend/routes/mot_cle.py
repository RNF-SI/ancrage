from models.models import db, MotCle, Reponse, Acteur
from flask import request, jsonify
from schemas.metier import MotCleSchema
from routes import bp, joinedload
from routes.logger_config import logger

@bp.route('/mots_cles/<int:id_diagnostic>', methods=['GET'])
def getAllMotCles(id_diagnostic):
    logger.info(f"📋 Requête GET - Mots-clés pour diagnostic ID={id_diagnostic}")
    
    mot_cles = MotCle.query.filter_by(diagnostic_id=id_diagnostic).all()
    logger.debug(f"🔍 {len(mot_cles)} mots-clés trouvés pour le diagnostic {id_diagnostic}")
    
    schema = MotCleSchema(many=True)
    usersObj = schema.dump(mot_cles)
    return jsonify(usersObj)

@bp.route('/mots_cles/theme/<int:id_acteur>', methods=['GET'])
def getKeywordsByActor(id_acteur):
    logger.info(f"📋 Requête GET - Mots-clés liés à l'acteur ID={id_acteur}")

    mots_cles = (
        db.session.query(MotCle)
        .join(MotCle.reponses)
        .join(Reponse.acteur)
        .filter(Acteur.id_acteur == id_acteur)
        .options(joinedload(MotCle.categorie))
        .all()
    )
    logger.debug(f"🔍 {len(mots_cles)} mots-clés récupérés pour l'acteur {id_acteur}")
    
    schema = MotCleSchema(many=True)
    return jsonify(schema.dump(mots_cles))

@bp.route('/mot_cle/<int:id_mot_cle>', methods=['PUT'])
def rename(id_mot_cle):
    
    mot_cle = MotCle.query.filter_by(id_mot_cle=id_mot_cle).first()

    if request.method == 'PUT':
       
        data = request.get_json()
        mot_cle.nom = data['nom']
        print(data['nom'])

        db.session.commit()
        
        schema = MotCleSchema(many=False)
        mcObj = schema.dump(mot_cle)
        return jsonify(mcObj)
    
@bp.route('/mot_cle', methods=['POST'])
def create_mot_cle():
    data = request.get_json()

   

    try:
        # Création du mot-clé parent
        mot_cle = MotCle(
            nom=data.get('nom'),
            categorie_id=data['categorie']['id_nomenclature'],
            mots_cles_groupe_id=data.get('mots_cles_groupe_id'),
            diagnostic_id=data['diagnostic']['id_diagnostic'],
            is_actif=data.get('is_actif', True)
        )
        db.session.add(mot_cle)
        db.session.flush()  # on récupère l'id du parent

        enfants_data = data.get('mots_cles_issus', [])
        enfants_ids = []

        for enfant_data in enfants_data:
            enfant_id = enfant_data.get('id_mot_cle')
            if enfant_id:
                # Mettre à jour un mot-clé existant
                enfant = MotCle.query.get(enfant_id)
                if enfant:
                    enfant.mots_cles_groupe_id = mot_cle.id_mot_cle
                    enfants_ids.append(enfant.id_mot_cle)
                else:
                    return jsonify({'error': f"Mot-clé enfant avec id {enfant_id} introuvable"}), 404
            else:
                # Créer un nouveau mot-clé enfant
                enfant = MotCle(
                    nom=enfant_data.get('nom'),
                    categorie_id=enfant_data.get('categorie_id'),
                    diagnostic_id=enfant_data.get('diagnostic_id', mot_cle.diagnostic_id),
                    mots_cles_groupe_id=mot_cle.id_mot_cle,
                    is_actif=enfant_data.get('is_actif', True)
                )
                db.session.add(enfant)
                db.session.flush()
                enfants_ids.append(enfant.id_mot_cle)

        db.session.commit()

        schema = MotCleSchema(many=False)
        mcObj = schema.dump(mot_cle)
        return jsonify(mcObj)

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
       