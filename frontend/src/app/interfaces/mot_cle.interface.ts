import { Nomenclature } from "@app/models/nomenclature.model";
import { Reponse } from "../models/reponse.model";
import { MotCle } from "@app/models/mot-cle.model";
import { Diagnostic } from "@app/models/diagnostic.model";

export interface IMotCle {
    id_mot_cle:number;
    nom:string;
    reponses?:Reponse[];
    categories:Nomenclature[];
    mots_cles_issus:MotCle[];
    diagnostic:Diagnostic;
    mot_cle_id_groupe?:number;
}
