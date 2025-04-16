import { ICommune } from "@app/interfaces/commune.interface";
import { Region } from "./region.model";
import { Departement } from "./departement.model";

export class Commune implements ICommune{
    id_commune=1;
    id: string="";
    nom_com="";
    insee_com="";
    insee_dep="";
    insee_reg="";
    region = new Region();
    departement = new Departement();


      /** Copie profonde de l'objet */
      copy(): Commune {
        const copy = new Commune();

        copy.id_commune = this.id_commune;
        copy.id = this.id;
        copy.nom_com = this.nom_com;
        copy.insee_com = this.insee_com;
        copy.insee_dep = this.insee_dep;
        copy.insee_reg = this.insee_reg;
        /* copy.region = this.region.copy();
        copy.departement = this.departement.copy(); */

        return copy;
    }

    /** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
    static fromJson(data: ICommune): Commune {
        const commune = new Commune();
        if (!data) return commune;
        commune.id_commune = data.id_commune;
        commune.id = data.id;
        commune.nom_com = data.nom_com;
        commune.insee_com = data.insee_com;
        commune.insee_dep = data.insee_dep;
        commune.insee_reg = data.insee_reg;
        /* commune.region = Region.fromJson(data.region);
        commune.departement = Departement.fromJson(data.departement); */


        return commune;
    }

/** Conversion en JSON, sans id_site si non voulu */
    toJson(): ICommune {
        const json: ICommune = {
            ...this,
            id_commune: this.id_commune,
            id: this.id,
            nom_com: this.nom_com,
            insee_com: this.insee_com,
            insee_dep: this.insee_dep,
            insee_reg: this.insee_reg,
            /* region: this.region.copy(),
            departement: this.departement.copy() */
        };
    
        return json;
    }

}
