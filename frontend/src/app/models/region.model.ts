import { IRegion } from "@app/interfaces/region.interface";
import { Commune } from "./commune.model";
import { Departement } from "./departement.model";

export class Region implements IRegion{
    id_region=0;
    id_reg: string="";
    nom_reg: string ="";
    insee_reg="";
    departements?:Departement[];
    communes?:Commune[];

    copy(): Region {
        const copy = new Region();
        copy.id_region=this.id_region;
        copy.id_reg= this.id_reg;
        copy.nom_reg = this.nom_reg;
        copy.insee_reg = this.insee_reg;
        copy.communes = this.communes?.map(c=>c.copy());
        copy.departements = this.departements?.map(d=>d.copy());

        return copy;
    }

    /** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
    static fromJson(data: IRegion): Region {
        const region = new Region();
        if (!data) return region;
        region.id_region = data.id_region;
        region.id_reg = data.id_reg;
        region.nom_reg = data.nom_reg;
        region.insee_reg = data.insee_reg;
        region.communes = data.communes ? (data.communes || []).map(c => Commune.fromJson(c)):undefined;
        region.departements = (data.departements || []).map(d => Departement.fromJson(d));


        return region;
    }

/** Conversion en JSON, sans id_site si non voulu */
    toJson(): IRegion {
        const json: IRegion = {
            ...this,
            id_region:this.id_region,
            id_reg: this.id_reg,
            nom_reg: this.nom_reg,
            insee_reg: this.insee_reg,
            communes: this.communes?.map(c=>c.copy()),
            departements: this.departements?.map(d=>d.copy())

        };
    
        return json;
    }
}
