import { Commune } from "@app/models/commune.model";
import { Departement } from "@app/models/departement.model";

export interface IRegion {
    id_region:number;
    id_reg: string;
    nom_reg: string;
    insee_reg:string;
    departements:Departement[];
    communes:Commune[];
}
