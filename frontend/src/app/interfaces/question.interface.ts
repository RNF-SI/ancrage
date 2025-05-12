import { Acteur } from "@app/models/acteur.model";
import { Nomenclature } from "@app/models/nomenclature.model";
import { Reponse } from "@app/models/reponse.model";

export interface IQuestion {
    id_question:number;
    libelle:string;
    acteurs?:Acteur[];
    reponses?:Reponse[];
    theme?:Nomenclature;
    indications:string;
}
