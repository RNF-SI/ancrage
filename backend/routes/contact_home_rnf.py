from flask import request, jsonify, current_app
from routes import bp
import requests
from flask_mail import Message
from extensions import mail


@bp.route("/contact-home-rnf/send", methods=["POST"])
def send_mail_contact():
    data = request.get_json() or {}
    
    token = data.get("token")

    if not token:
  
        return jsonify({"error": "Token captcha manquant"}), 400

    secret = current_app.config.get("RECAPTCHA_SECRET_KEY")
    try:
        response = requests.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={"secret": secret, "response": token},
            timeout=5
        )
        result = response.json()

    except Exception as e:
        return jsonify({"error": "Vérification reCAPTCHA impossible"}), 500

    if not result.get("success") or result.get("score", 0) < 0.5:
        return jsonify({"error": "Échec reCAPTCHA"}), 403

    try:
        destinataire = current_app.config.get("MAIL_RECEIVER")
        expediteur = data.get("expediteur")
        nom = data.get("nom")
        objet = data.get("objet")
        message = data.get("message")

        if not destinataire:
            return jsonify({"error": "Champ destinataire manquant"}), 400
        
        msg = Message(
            subject=f"[Contact RNF] {objet}",
            recipients=[destinataire],
            body=f"Message de {nom} <{expediteur}> :\n\n{message}"
        )

        mail.send(msg)
        return jsonify({"message": "Email envoyé avec succès"}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": f"Erreur lors de l'envoi du mail {e}"}), 500