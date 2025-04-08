import { Nomenclature } from "./nomenclature.model";
import { Site } from "./site.model";

export class Entretien {
    id_entretien=1;
    site = new Site();
    date_entretien= new Date();
    contexte="";
    statut = new Nomenclature();
    created_at:Date | undefined;
    modified_at:Date | undefined;
    created_by:number=0;
}
