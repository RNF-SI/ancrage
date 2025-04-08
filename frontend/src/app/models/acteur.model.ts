import { Commune } from "./commune.model";
import { Diagnostic } from "./diagnostic.model";
import { Entretien } from "./entretien.model";
import { Nomenclature } from "./nomenclature.model";

export class Acteur {
    id_acteur:number = 1;
    nom:string="";
    prenom:string="";
    fonction:string="";
    telephone:string="06 06 06 06 06";
    mail:string="mail@mail.com";
    commune:Commune=new Commune();
    profilCognitif= new Nomenclature();
    isActeurEconomique:boolean=false;
    structure="";
    diagnostic = new Diagnostic();
    entretien = new Entretien();
    created_at:Date | undefined;
    modified_at:Date | undefined;
    created_by:number=0;
    modified_by:number=0;
}
