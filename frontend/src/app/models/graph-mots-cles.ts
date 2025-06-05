import { IGraphMotsCles } from "@app/interfaces/igraph-mots-cles";
import { MotCle } from "./mot-cle.model";

export class GraphMotsCles {
    id_afom:number=0;
    mot_cle:MotCle=new MotCle();
    nombre:number=0;

    copy(): GraphMotsCles {
            const copy = new GraphMotsCles();
    
            copy.id_afom = this.id_afom;
            copy.nombre = this.nombre;
            copy.mot_cle = this.mot_cle.copy();
            
            return copy;
        }
    
        /** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
        static fromJson(data: IGraphMotsCles): GraphMotsCles {
            const gmc = new GraphMotsCles();
    
            gmc.id_afom = data.id_afom;
            gmc.nombre = data.nombre;
            gmc.mot_cle = MotCle.fromJson(data.mot_cle);
            return gmc;
        }
    
        toJson(): IGraphMotsCles {
            return {
                ...this,
                mot_cle: this.mot_cle.toJson(),
            };
        }
}
