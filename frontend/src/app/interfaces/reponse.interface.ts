import { MotCle } from "@app/models/mot-cle.model";
import { Nomenclature } from "@app/models/nomenclature.model";
import { Question } from "@app/models/question.model";

export interface IReponse {
    id_reponse:number;
    valeur_reponse:Nomenclature;
    question?:Question;
    mots_cles?:MotCle[];
}
