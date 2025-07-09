import { IMail } from "@app/interfaces/mail.interface";


export class Mail{
    destinataire = "";
    expediteur = "";
    nom = "";
    objet = "";
    message = "";
    token="";

    /** Copie profonde de l'objet */
        copy(): Mail {
            const copy = new Mail();
            copy.destinataire = this.destinataire;
            copy.expediteur = this.expediteur;
            copy.nom = this.nom;
            copy.objet = this.objet;
            copy.message = this.message;
            copy.token = this.token;
            
            return copy;
        }
    
        /** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
        static fromJson(data: IMail): Mail {
            const mail = new Mail();
    
            mail.destinataire = data.destinataire;
            mail.destinataire = data.destinataire;
            mail.expediteur = data.expediteur;
            mail.nom = data.nom;
            mail.objet = data.objet;
            mail.message = data.message;
            mail.token = data.token;

            return mail;
        }
    
        toJson(): IMail {
            return {
                ...this
               
            };
        }
}