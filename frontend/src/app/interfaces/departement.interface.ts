import { IRegion } from "./region.interface";
import { ICommune } from "./commune.interface";

export interface IDepartement {
    id_departement:number;
    id_dep:string;
    nom_dep:string;
    insee_dep:string;
    insee_reg:string;
    communes?:ICommune[];
    region:IRegion;
}
