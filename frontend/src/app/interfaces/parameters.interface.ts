import { Acteur } from "@app/models/acteur.model";
import { Nomenclature } from "@app/models/nomenclature.model";
import { Question } from "@app/models/question.model";

export interface IParameters {
    questions:Question[];
    categories:Nomenclature[];
    acteurs:Acteur[];
    mode:string;
}