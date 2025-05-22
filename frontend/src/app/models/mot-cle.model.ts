import { IMotCle } from "@app/interfaces/mot_cle.interface";
import { Reponse } from "./reponse.model";

export class MotCle {
    id_mot_cle=1;
    nom="";
    reponses?:Reponse[];

    /** Copie profonde de l'objet */
    copy(): MotCle {
        const copy = new MotCle();

        copy.id_mot_cle = this.id_mot_cle;
        copy.nom = this.nom;
        copy.reponses = this.reponses?.map(r => r.copy()) || [];
        
        return copy;
    }

    /** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
    static fromJson(data: IMotCle): MotCle {
        const mot_cle = new MotCle();

        mot_cle.id_mot_cle = data.id_mot_cle;
        mot_cle.nom = data.nom;
        mot_cle.reponses = (data.reponses || []).map(r => Reponse.fromJson(r));

        return mot_cle;
    }

    /** Conversion en JSON, sans id_site si non voulu */
    toJson(): IMotCle {
        return {
            ...this,
            reponses: this.reponses ? this.reponses.map(r => r.toJson()) : [],
        };
    }
    
}
