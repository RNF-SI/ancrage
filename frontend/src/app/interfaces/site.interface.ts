import { Diagnostic } from "@app/models/diagnostic.model";
import { Nomenclature } from "@app/models/nomenclature.model";
import { Region } from "@app/models/region.model";
import { IDepartement } from "./departement.interface";
import { IDiagnostic } from "./diagnostic.interface";

export interface ISite {
   
    id_site: number;
    nom: string;
    position_x:string;
    position_y:string;
    type:Nomenclature;
    diagnostics:IDiagnostic[];
    departements:IDepartement[];
    habitats:Nomenclature[];
    id_inpn:number;
    created_at:Date | undefined;
    modified_at:Date | undefined;
    created_by:number;
    modified_by:number;
    selected:boolean;
}
