import { IDiagnostic } from "@app/interfaces/diagnostic.interface";
import { Site } from "./site.model";
import * as moment from 'moment';

export class Diagnostic implements IDiagnostic {

	id_diagnostic: number = -1;
	nom: string = "Diagnostic";
	date_debut?= new Date();
	date_debut_str?: string ="";
	date_fin: Date | undefined;
	rapport: string = "";
	sites: Site[] = [];
	created_at_str?: string = "";
	created_at?= new Date();
	modified_at: Date | undefined;
	created_by: number = 0;

	/** Création depuis JSON brut */
	static fromJson(data: IDiagnostic): Diagnostic {
		const diag = new Diagnostic();

		diag.id_diagnostic = data.id_diagnostic;
		diag.nom = data.nom;
		diag.date_debut = data.date_debut ? new Date(data.date_debut) : undefined;
		diag.date_debut_str = data.date_debut ? moment(new Date(data.date_debut)).format("DD/MM/YYYY") : undefined;
		diag.date_fin = data.date_fin ? new Date(data.date_fin) : undefined;
		diag.rapport = data.rapport;
		diag.sites = (data.sites || []).map(s => Site.fromJson(s));
		diag.created_at = data.created_at ? new Date(data.created_at) : undefined;
		diag.modified_at = data.modified_at ? new Date(data.modified_at) : undefined;
		diag.created_by = data.created_by;

		return diag;
	}

	/** Conversion en JSON (avec dates formatées ISO) */
	toJson(): IDiagnostic {
		const json: IDiagnostic = {
			...this,
			id_diagnostic: this.id_diagnostic,
			nom: this.nom,
			date_debut: this.date_debut ? this.date_debut : undefined,
			date_debut_str: this.date_debut ? moment(new Date(this.date_debut)).format("DD/MM/YYYY") : undefined,
			date_fin: this.date_fin ? this.date_fin.toISOString() : undefined,
			rapport: this.rapport,
			sites: this.sites.map(s => s.toJson()),
			created_at: this.created_at ? this.created_at.toISOString() : undefined,
			modified_at: this.modified_at ? this.modified_at.toISOString() : undefined,
			created_by: this.created_by,
		};
		return json;
	}
}