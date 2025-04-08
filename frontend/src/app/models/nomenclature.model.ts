import { TypeNomenclature } from "./type-nomenclature.model";

export class Nomenclature {
    id_nomenclature=1;
    label="";
    typeSite=new TypeNomenclature();
    value=1;
    mnemonique="";
    profilCognitif = new TypeNomenclature();
    statutEntretien = new TypeNomenclature();
    habitat = new TypeNomenclature();;
}
