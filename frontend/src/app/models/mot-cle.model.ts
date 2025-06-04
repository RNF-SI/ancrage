import { IMotCle } from "@app/interfaces/mot_cle.interface";
import { Reponse } from "./reponse.model";
import { Nomenclature } from "./nomenclature.model";
import { Diagnostic } from "./diagnostic.model";

export class MotCle {
    id_mot_cle=0;
    nom="";
    reponses?:Reponse[];
    categories:Nomenclature[] = [];
    mots_cles_issus:MotCle[]=[];
    diagnostic:Diagnostic = new Diagnostic();
    mot_cle_id_groupe?:number;

    /** Copie profonde de l'objet */
    copy(): MotCle {
        const copy = new MotCle();

        copy.id_mot_cle = this.id_mot_cle;
        copy.nom = this.nom;
        copy.reponses = this.reponses?.map(r => r.copy()) || [];
        copy.mots_cles_issus = this.mots_cles_issus?.map(r => r.copy()) || [];
        copy.categories = this.categories?.map(c => c.copy()) || [];
        copy.diagnostic = this.diagnostic.copy();
        copy.mot_cle_id_groupe = this.mot_cle_id_groupe;
        return copy;
    }

    /** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
    static fromJson(data: IMotCle): MotCle {
        const mot_cle = new MotCle();

        mot_cle.id_mot_cle = data.id_mot_cle;
        mot_cle.nom = data.nom;
        mot_cle.reponses = (data.reponses || []).map(r => Reponse.fromJson(r));
        mot_cle.mots_cles_issus = (data.mots_cles_issus || []).map(mc => MotCle.fromJson(mc));
        mot_cle.categories = (data.categories || []).map(c => Nomenclature.fromJson(c));
        mot_cle.diagnostic = Diagnostic.fromJson(data.diagnostic);
        mot_cle.mot_cle_id_groupe = data.mot_cle_id_groupe;
        return mot_cle;
    }

    toJson(): IMotCle {
        return {
            ...this,
            reponses: this.reponses ? this.reponses.map(r => r.toJson()) : [],
            mots_cles: this.mots_cles_issus ? this.mots_cles_issus.map(r => r.toJson()) : [],
            categories: this.categories ? this.categories.map(c => c.toJson()) : [],
            diagnostic: this.diagnostic!.toJson(),
        };
    }
    
}
