import { IParameters } from "@app/interfaces/parameters.interface";
import { Acteur } from "./acteur.model";
import { Nomenclature } from "./nomenclature.model";
import { Question } from "./question.model";

export class Parameters {
    questions:Question[] = [];
    categories:Nomenclature[] = [];
    acteurs:Acteur[] = [];
    mode = "";

    /** Copie profonde de l'objet */
        copy(): Parameters {
            const copy = new Parameters();
            copy.questions = this.questions?.map(q => q.copy()) || [];
            copy.categories = this.categories?.map(c => c.copy()) || [];
            copy.acteurs = this.acteurs?.map(a => a.copy()) || [];
            copy.mode = this.mode;
    
            return copy;
        }
    
        /** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
        static fromJson(data: IParameters): Parameters {
            const parameters = new Parameters();
            parameters.questions = (data.questions || []).map(q => Question.fromJson(q));
            parameters.categories = (data.categories || []).map(c => Nomenclature.fromJson(c));
            parameters.acteurs = (data.acteurs || []).map(a => Acteur.fromJson(a));
            parameters.mode = data.mode;
    
            return parameters;
        }
    
        /** Conversion en JSON, sans id_site si non voulu */
        toJson(): IParameters {
            return {
                ...this,
                questions: this.questions ? this.questions.map(q => q.toJson()) : [],
                categories: this.categories ? this.categories.map(c => c.toJson()) : [],
                acteurs: this.acteurs ? this.acteurs.map(c => c.toJson()) : [],
                
            };
        }
}