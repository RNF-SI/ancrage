import { IDepartement } from "./departement.interface";
import { ICommune } from "./commune.interface";

export interface IRegion {
    id_region:number;
    id_reg: string;
    nom_reg: string;
    insee_reg:string;
    departements?:IDepartement[];
    communes?:ICommune[];
}
