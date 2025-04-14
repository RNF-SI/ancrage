import { Commune } from "@app/models/commune.model";
import { Region } from "@app/models/region.model";

export interface IDepartement {
    id_dep:string;
    nom_dep:string;
    insee_dep:string;
    insee_reg:string;
    communes:Commune[];
    region:Region;
}
