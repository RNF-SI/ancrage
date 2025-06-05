import { IGraphMotsCles } from "@app/interfaces/igraph-mots-cles";
import { Diagnostic } from "./diagnostic.model";
import { MotCle } from "./mot-cle.model";

export class GraphMotsCles {
    id_graph_mots_cles:number=0;
    mots_cles:MotCle[]=[];
    diagnostic:Diagnostic = new Diagnostic();
    nombre:number=0;

    copy(): GraphMotsCles {
            const copy = new GraphMotsCles();
    
            copy.id_graph_mots_cles = this.id_graph_mots_cles;
            copy.nombre = this.nombre;
            copy.diagnostic = this.diagnostic?.copy();
            copy.mots_cles = this.mots_cles?.map(mc => mc.copy()) || [];
            
            return copy;
        }
    
        /** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
        static fromJson(data: IGraphMotsCles): GraphMotsCles {
            const gmc = new GraphMotsCles();
    
            gmc.id_graph_mots_cles = data.id_graph_mots_cles;
            gmc.nombre = data.nombre;
            gmc.diagnostic = data.diagnostic ? Diagnostic.fromJson(data.diagnostic) : new Diagnostic();
            gmc.mots_cles = Array.isArray(data.mots_cles) ? data.mots_cles.map(mc => MotCle.fromJson(mc)) : [];
            return gmc;
        }
    
        toJson(): IGraphMotsCles {
            return {
                ...this,
                diagnostic: this.diagnostic ? this.diagnostic.toJson() : undefined,
                mots_cles: this.mots_cles ? this.mots_cles.map(mc => mc.toJson()) : [],
            };
        }
}
