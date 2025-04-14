import { TypeNomenclature } from "@app/models/type-nomenclature.model";

export interface NomenclatureInterface {
    id_nomenclature: number;
    label: string;
    typeSite: TypeNomenclature;
    value: number;
    mnemonique: string;
    profilCognitif: TypeNomenclature;
    statutEntretien: TypeNomenclature;
    habitat: TypeNomenclature;
    
}
