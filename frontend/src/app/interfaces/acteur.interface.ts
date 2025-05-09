import { Commune } from "@app/models/commune.model";
import { Diagnostic } from "@app/models/diagnostic.model";
import { Nomenclature } from "@app/models/nomenclature.model";

export interface IActeur {
    id_acteur:number;
    nom:string;
    prenom:string;
    fonction:string;
    telephone:string;
    mail:string;
    commune:Commune;
    profil?:Nomenclature;
    is_acteur_economique:boolean;
    structure:string;
    diagnostic?:Diagnostic;
    categories?: Nomenclature[];
    statut_entretien?:Nomenclature;
    created_at:Date | undefined;
    modified_at:Date | undefined;
    created_by:number;
    modified_by:number;
}
