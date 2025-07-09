from flask import request, jsonify
from configs.mail_config import mail,Message
from routes import bp,current_app
import requests
from configs.logger_config import logger

@bp.route("/mail/send", methods=["POST"])
def send_mail():
    data = request.get_json()
    token = data.get("token")
    if not token:
        logger.error({"error": "Token captcha manquant"}), 400

    secret = current_app.config.get("RECAPTCHA_SECRET_KEY")
    response = requests.post(
        "https://www.google.com/recaptcha/api/siteverify",
        data={"secret": secret, "response": token}
    )
    result = response.json()
   
    if not result.get("success") or result.get("score", 0) < 0.5:
        return jsonify({"error": "Échec reCAPTCHA"}), 403
    try:
        destinataire = current_app.config.get("MAIL_DEFAULT_RECEIVER")
        expediteur = data["expediteur"]
        nom = data["nom"]
        objet = data["objet"]
        message = data["message"]

        msg = Message(
            subject=f"[Contact RNF] {objet}",
            recipients=[destinataire],
            sender=current_app.config.get("MAIL_SENDER"),
            body=f"Message de {nom} <{expediteur}> :\n\n{message}"
        )

        mail.send(msg)
        return jsonify({"message": "Email envoyé avec succès"}), 200

    except Exception as e:
        print(f"[ERREUR ENVOI MAIL] {e}")
        return jsonify({"error": "Erreur lors de l'envoi du mail"}), 500