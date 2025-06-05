import { Diagnostic } from "@app/models/diagnostic.model";
import { MotCle } from "@app/models/mot-cle.model";

export interface IGraphMotsCles {
    id_graph_mots_cles:number;
    mots_cles:MotCle[];
    diagnostic:Diagnostic;
    nombre:number;
}
