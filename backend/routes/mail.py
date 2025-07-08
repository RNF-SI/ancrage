from flask import request, jsonify
from configs.mail_config import mail,Message
from routes import bp,current_app

@bp.route("/mail/send", methods=["POST"])
def send_mail():
    data = request.get_json()

    try:
        destinataire = data["destinataire"]
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