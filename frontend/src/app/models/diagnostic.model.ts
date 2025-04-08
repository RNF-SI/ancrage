import { Site } from "./site.model";


export class Diagnostic{
  
	id: number = -1;
	nom: string = "Diagnostic";
	date_debut: Date | undefined;
	date_fin: Date | undefined;
	rapport="";
	site = new Site();
	created_at:Date | undefined;
    modified_at:Date | undefined;
    created_by:number=0;

}