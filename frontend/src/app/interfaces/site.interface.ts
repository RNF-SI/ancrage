import { Diagnostic } from "@app/models/diagnostic.model";
import { Nomenclature } from "@app/models/nomenclature.model";

export interface ISite {
   
    id_site: number;
    nom: string;
    position_x:string;
    position_y:string;
    type:Nomenclature;
    diagnostics:Diagnostic[];
    habitats:Nomenclature[];
    created_at:Date | undefined;
    modified_at:Date | undefined;
    created_by:number;
    modified_by:number;
    
}
