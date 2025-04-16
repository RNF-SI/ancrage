import { IDepartement } from "@app/interfaces/departement.interface";
import { Commune } from "./commune.model";
import { Region } from "./region.model";

export class Departement implements IDepartement {
    id_departement = 0;
    id_dep = "";
    nom_dep = "";
    insee_dep = "";
    insee_reg = "";
    communes: Commune[] = [];
    region = new Region();

    static fromJson(data: IDepartement): Departement {
        const departement = new Departement();
        departement.id_departement = data.id_departement;
        departement.id_dep = data.id_dep;
        departement.nom_dep = data.nom_dep;
        departement.insee_reg = data.insee_reg;
        departement.insee_dep = data.insee_dep;
        departement.communes = (data.communes || []).map(c => Commune.fromJson(c));
        departement.region = data.region ? Region.fromJson(data.region) : new Region();

        return departement;
    }

    toJson(): IDepartement {
        const json: IDepartement = {
            ...this,
            id_departement: this.id_departement,
            id_dep: this.id_dep,
            nom_dep: this.nom_dep,
            insee_dep: this.insee_dep,
            insee_reg: this.insee_reg,
            communes: this.communes.map(c => c.toJson()),
            region: this.region.toJson()
        };
        return json;
    }
}

