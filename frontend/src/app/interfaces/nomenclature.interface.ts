import { Question } from "@app/models/question.model";

export interface INomenclature {
    id_nomenclature: number;
    libelle: string;
    value: number;
    mnemonique: string;
    questions?:Question[];
}
