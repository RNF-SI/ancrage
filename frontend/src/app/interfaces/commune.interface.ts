import { Departement } from "@app/models/departement.model";
import { Region } from "@app/models/region.model";

export interface ICommune {
    id_commune: number;
    id:string;
    nom_com:string;
    insee_com:string;
    insee_dep:string;
    insee_reg:string;
    region:Region;
    departement:Departement;
    latitude?:string;
    longitude?:string;
}
