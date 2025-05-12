import { IQuestion } from "@app/interfaces/question.interface";
import { Nomenclature } from "./nomenclature.model";
import { Reponse } from "./reponse.model";
import { Acteur } from "./acteur.model";

export class Question {
    id_question = 0;
    libelle = "";
    acteurs?:Acteur[];
    reponses?:Reponse[];
    theme?:Nomenclature;
    indications:string="";

    /** Copie profonde de l'objet */
    copy(): Question {
        const copy = new Question();

        copy.id_question = this.id_question;
        copy.libelle = this.libelle;
        copy.theme = this.theme?.copy();
        copy.acteurs = this.acteurs?.map(a => a.copy()) || [];
        copy.reponses = this.reponses?.map(r => r.copy()) || [];
        copy.indications = this.indications;
        return copy;
    }

    /** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
    static fromJson(data: IQuestion): Question {
        const question = new Question();

        question.id_question = data.id_question;
        question.libelle = data.libelle;
        question.theme = data.theme ? Nomenclature.fromJson(data.theme) : new Nomenclature();
        question.acteurs = (data.acteurs || []).map(a => Acteur.fromJson(a));
        question.reponses = (data.reponses || []).map(r => Reponse.fromJson(r));
        question.indications = data.indications ?? '';

        return question;
    }

    /** Conversion en JSON, sans id_site si non voulu */
    toJson(): IQuestion {
        return {
            ...this,
            theme: this.theme ? this.theme.toJson() : undefined,
            acteurs: this.acteurs ? this.acteurs.map(a => a.toJson()) : [],
            reponses: this.reponses ? this.reponses.map(r => r.toJson()) : [],
            indications: this.indications ? this.indications : ""
        };
    }

}
