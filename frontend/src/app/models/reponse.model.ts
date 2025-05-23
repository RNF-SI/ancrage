import { IReponse } from "@app/interfaces/reponse.interface";
import { Acteur } from "./acteur.model";
import { MotCle } from "./mot-cle.model";
import { Nomenclature } from "./nomenclature.model";
import { Question } from "./question.model";

export class Reponse {
    id_reponse=1;
    valeur_reponse = new Nomenclature();
    mots_cles?:MotCle[];
    question?:Question;
    acteur:Acteur = new Acteur();
    commentaires="";

    /** Copie profonde de l'objet */
        copy(): Reponse {
            const copy = new Reponse();
            copy.id_reponse = this.id_reponse;
            copy.valeur_reponse = this.valeur_reponse.copy();
            copy.mots_cles = this.mots_cles?.map(mc => mc.copy()) || [];
            copy.question = this.question?.copy();
            copy.acteur = this.acteur.copy();
            copy.commentaires = this.commentaires;
    
            return copy;
        }
    
        /** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
        static fromJson(data: IReponse): Reponse {
            const reponse = new Reponse();
    
            reponse.id_reponse = data.id_reponse;
            reponse.valeur_reponse = data.valeur_reponse ? Nomenclature.fromJson(data.valeur_reponse) : new Nomenclature();
            reponse.mots_cles = (data.mots_cles || []).map(mc => MotCle.fromJson(mc));
            reponse.question = data.question ? Question.fromJson(data.question) : undefined;
            reponse.acteur = data.acteur ? Acteur.fromJson(data.acteur) : new Acteur();
            reponse.commentaires = data.commentaires;
    
            return reponse;
        }
    
        /** Conversion en JSON, sans id_site si non voulu */
        toJson(): IReponse {
            return {
                ...this,
                valeur_reponse: this.valeur_reponse ? this.valeur_reponse.toJson() : undefined,
                question: this.question ? this.question.toJson() : undefined,
                mots_cles: this.mots_cles ? this.mots_cles.map(mc => mc.toJson()) : [],
                acteur: this.acteur.toJson(),
            
            };
        }
    

}
