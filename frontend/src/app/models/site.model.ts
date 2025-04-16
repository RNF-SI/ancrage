import { ISite } from "@app/interfaces/site.interface";
import { Diagnostic } from "./diagnostic.model";
import { Nomenclature } from "./nomenclature.model";
import { Departement } from "./departement.model";

export class Site implements ISite {
	id_site: number = 1;
	nom: string = "";
	position_x: string = "";
	position_y: string = "";
	diagnostics: Diagnostic[] = [];
	habitats: Nomenclature[] = [];
	departements:Departement[] = [];
	type: Nomenclature = new Nomenclature();
	created_at: Date | undefined;
	modified_at: Date | undefined;
	created_by: number = 0;
	modified_by: number = 0;

	/** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
	static fromJson(data: ISite): Site {
		const site = new Site();

		site.id_site = data.id_site;
		site.nom = data.nom;
		site.position_x = data.position_x;
		site.position_y = data.position_y;
		site.diagnostics = (data.diagnostics || []).map(d => Diagnostic.fromJson(d));
		site.habitats = (data.habitats || []).map(h => Nomenclature.fromJson(h));
		site.type = Nomenclature.fromJson(data.type);
		site.departements = (data.departements || []).map(h => Departement.fromJson(h));
		site.created_at = data.created_at ? new Date(data.created_at) : undefined;
		site.modified_at = data.modified_at ? new Date(data.modified_at) : undefined;
		site.created_by = data.created_by;
		site.modified_by = data.modified_by;

		return site;
	}

	/** Conversion en JSON, sans id_site si non voulu */
	toJson(): ISite {
		const json: ISite = {
			...this,
			diagnostics: this.diagnostics.map(d => d.toJson()),
			habitats: this.habitats.map(h => h.toJson()),
			departements: this.departements.map(h => h.toJson()),
			type: this.type.toJson(),
			created_at: this.created_at ? new Date(this.created_at) : undefined,
			modified_at: this.modified_at ? new Date(this.modified_at) : undefined,
			created_by: this.created_by,
			modified_by: this.modified_by
		};
	
		return json;
	}
}
