import { MotCle } from "@app/models/mot-cle.model";
import { Nomenclature } from "@app/models/nomenclature.model";
import { Question } from "@app/models/question.model";

export interface INomenclature {
    id_nomenclature: number;
    libelle: string;
    value: number;
    mnemonique: string;
    questions?:Question[];
    mots_cles?:MotCle[];
    
}
