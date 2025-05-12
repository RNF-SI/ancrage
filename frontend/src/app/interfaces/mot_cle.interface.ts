import { Reponse } from "../models/reponse.model";

export interface IMotCle {
    id_mot_cle:number;
    nom:string;
    reponses?:Reponse[];
}
