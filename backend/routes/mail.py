from flask import request, jsonify
from configs.mail_config import mail,Message
from routes import bp,current_app
import requests
from configs.logger_config import logger

@bp.route("/mail/send", methods=["POST"])
def send_mail():
    data = request.get_json() or {}
    
    token = data.get("token")
    logger.info("data=%s, token=%s", data)

    if not token:
        logger.error("Token captcha manquant")
        return jsonify({"error": "Token captcha manquant"}), 400

    secret = current_app.config.get("RECAPTCHA_SECRET_KEY")
    try:
        response = requests.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={"secret": secret, "response": token},
            timeout=5
        )
        result = response.json()
        logger.info(result)
    except Exception as e:
        logger.error(f"Erreur appel reCAPTCHA: {e}")
        return jsonify({"error": "Vérification reCAPTCHA impossible"}), 500

    if not result.get("success") or result.get("score", 0) < 0.5:
        return jsonify({"error": "Échec reCAPTCHA"}), 403

    try:
        destinataire = current_app.config.get("MAIL_DEFAULT_RECEIVER")
        expediteur = data.get("expediteur")
        nom = data.get("nom")
        objet = data.get("objet")
        message = data.get("message")

        if not destinataire:
            logger.error("Destinataire manquant")
            return jsonify({"error": "Champ destinataire manquant"}), 400
        
        msg = Message(
            subject=f"[Contact RNF] {objet}",
            recipients=[destinataire],
            body=f"Message de {nom} <{expediteur}> :\n\n{message}"
        )

        mail.send(msg)
        return jsonify({"message": "Email envoyé avec succès"}), 200

    except Exception as e:
        logger.error(f"Erreur lors de l'envoi du mail: {e}")
        return jsonify({"error": "Erreur lors de l'envoi du mail"}), 500