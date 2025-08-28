import { Acteur } from "@app/models/acteur.model";
import { Diagnostic } from "@app/models/diagnostic.model";
import { Question } from "@app/models/question.model";

export interface IParameters {
    questions:Question[];
    acteurs:Acteur[];
    diagnostic:Diagnostic;
}