import { IMotCle } from "@app/interfaces/mot_cle.interface";
import { Reponse } from "./reponse.model";
import { Nomenclature } from "./nomenclature.model";
import { Diagnostic } from "./diagnostic.model";

export class MotCle {
    id_mot_cle=1;
    nom="";
    reponses?:Reponse[];
    categorie:Nomenclature = new Nomenclature();
    mots_cles?:MotCle[];
    diagnostic:Diagnostic = new Diagnostic();

    /** Copie profonde de l'objet */
    copy(): MotCle {
        const copy = new MotCle();

        copy.id_mot_cle = this.id_mot_cle;
        copy.nom = this.nom;
        copy.reponses = this.reponses?.map(r => r.copy()) || [];
        copy.mots_cles = this.mots_cles?.map(r => r.copy()) || [];
        copy.categorie = this.categorie?.copy();
        copy.diagnostic = this.diagnostic.copy();
        return copy;
    }

    /** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
    static fromJson(data: IMotCle): MotCle {
        const mot_cle = new MotCle();

        mot_cle.id_mot_cle = data.id_mot_cle;
        mot_cle.nom = data.nom;
        mot_cle.reponses = (data.reponses || []).map(r => Reponse.fromJson(r));
        mot_cle.mots_cles = (data.mots_cles || []).map(mc => MotCle.fromJson(mc));
        mot_cle.categorie = Nomenclature.fromJson(data.categorie!);
        mot_cle.diagnostic = Diagnostic.fromJson(data.diagnostic);

        return mot_cle;
    }

    toJson(): IMotCle {
        return {
            ...this,
            reponses: this.reponses ? this.reponses.map(r => r.toJson()) : [],
            mots_cles: this.mots_cles ? this.mots_cles.map(r => r.toJson()) : [],
            categorie: this.categorie!.toJson(),
            diagnostic: this.diagnostic!.toJson(),
        };
    }
    
}
