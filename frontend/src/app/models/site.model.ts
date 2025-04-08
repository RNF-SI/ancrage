import { Type } from "@angular/core";
import { Diagnostic } from "./diagnostic.model";
import { Nomenclature } from "./nomenclature.model";

export class Site {
    id_site: number =1;
    nom: string ="";
    position_x:string="";
    position_y:string = "";
    diagnostics:Diagnostic[]=[];
    habitats:Nomenclature[]=[];
    type = new Nomenclature();
    created_at:Date | undefined;
    modified_at:Date | undefined;
    created_by:number=0;
    modified_by:number=0;

}


