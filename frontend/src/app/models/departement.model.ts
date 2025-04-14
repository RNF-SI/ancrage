import { IDepartement } from "@app/interfaces/departement.interface";
import { Commune } from "./commune.model";
import { Region } from "./region.model";

export class Departement implements IDepartement{
    id_dep="";
    nom_dep="";
    insee_dep="";
    insee_reg="";
    communes:Commune[]=[];
    region= new Region();

    copy(): Departement {
            const copy = new Departement();
    
            copy.id_dep= this.id_dep;
            copy.nom_dep = this.nom_dep;
            copy.insee_reg = this.insee_reg;
            copy.communes = this.communes.map(c=>c.copy());
            copy.region = this.region.copy();
    
            return copy;
        }
    
    /** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
    static fromJson(data: IDepartement): Departement {
        const departement = new Departement();

        departement.id_dep = data.id_dep;
        departement.nom_dep = data.nom_dep;
        departement.insee_reg = data.insee_reg;
        departement.communes = (data.communes || []).map(c => Commune.fromJson(c));
        departement.region = Region.fromJson(data.region);


        return departement;
    }

/** Conversion en JSON, sans id_site si non voulu */
    toJson(): IDepartement {
        const json: IDepartement = {
            ...this,
            id_dep: this.id_dep,
            nom_dep: this.nom_dep,
            insee_reg: this.insee_reg,
            commune: this.communes.map(c=>c.copy()),
            departements: this.region.copy()

        };
    
        return json;
    }
}


