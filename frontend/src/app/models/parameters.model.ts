import { IParameters } from "@app/interfaces/parameters.interface";
import { Acteur } from "./acteur.model";
import { Question } from "./question.model";
import { Diagnostic } from "./diagnostic.model";

export class Parameters {
    questions:Question[] = [];
    acteurs:Acteur[] = [];
    diagnostic:Diagnostic = new Diagnostic();
    is_displayed = false;

    /** Copie profonde de l'objet */
        copy(): Parameters {
            const copy = new Parameters();
            copy.questions = this.questions?.map(q => q.copy()) || [];
            copy.acteurs = this.acteurs?.map(a => a.copy()) || [];
            copy.diagnostic = this.diagnostic.copy();
            copy.is_displayed = this.is_displayed;
    
            return copy;
        }
    
        /** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
        static fromJson(data: IParameters): Parameters {
            const parameters = new Parameters();
            parameters.questions = (data.questions || []).map(q => Question.fromJson(q));
            parameters.acteurs = (data.acteurs || []).map(a => Acteur.fromJson(a));
            parameters.diagnostic = Diagnostic.fromJson(data.diagnostic);
            parameters.is_displayed = data.is_displayed;
    
            return parameters;
        }
    
        /** Conversion en JSON, sans id_site si non voulu */
        toJson(): IParameters {
            return {
                ...this,
                questions: this.questions ? this.questions.map(q => q.toJson()) : [],
                acteurs: this.acteurs ? this.acteurs.map(c => c.toJson()) : [],
                diagnostic: this.diagnostic.toJson()
            };
        }
}