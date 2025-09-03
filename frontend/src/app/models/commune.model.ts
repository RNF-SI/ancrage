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
    departement:Departement = new Departement();
    latitude?:string;
    longitude?:string;
    code_postal?:string;

      /** Copie profonde de l'objet */
      copy(): Commune {
        const copy = new Commune();

        copy.id_commune = this.id_commune;
        copy.id = this.id;
        copy.nom_com = this.nom_com;
        copy.insee_com = this.insee_com;
        copy.insee_dep = this.insee_dep;
        copy.insee_reg = this.insee_reg;
        copy.region = this.region.copy();
        copy.departement = this.departement.copy();
        copy.latitude = this.latitude;
        copy.longitude = this.longitude;
        copy.code_postal = this.code_postal;

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
        commune.region = Region.fromJson(data.region);
        commune.departement = Departement.fromJson(data.departement);
        commune.latitude = data.latitude;
        commune.longitude = data.longitude;
        commune.code_postal = data.code_postal;

        return commune;
    }

/** Conversion en JSON, sans id_site si non voulu */
    toJson(): ICommune {
        const json: ICommune = {
            ...this,
            region: this.region.copy(),
            departement: this.departement.copy()
        };
    
        return json;
    }

}
