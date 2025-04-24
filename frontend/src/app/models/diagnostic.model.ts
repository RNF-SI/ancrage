import { IDiagnostic } from "@app/interfaces/diagnostic.interface";
import { Site } from "./site.model";
import * as moment from 'moment';

export class Diagnostic implements IDiagnostic {

	id_diagnostic: number = -1;
	nom: string = "Diagnostic";
	date_debut?= new Date();
	date_debut_str?: string ="";
	date_fin: Date | undefined;
	sites: Site[] = [];
	is_read_only=false;
	id_organisme:number = 0
	created_at_str?: string = "";
	created_at?= new Date();
	modified_at: Date | undefined;
	created_by: number = 0;

	copy(): Diagnostic {
		const copy = new Diagnostic();

		copy.id_diagnostic = this.id_diagnostic;
		copy.nom = this.nom;
		copy.date_debut = this.date_debut ? new Date(this.date_debut.getTime()) : undefined;
		copy.date_fin = this.date_fin ? new Date(this.date_fin.getTime()) : undefined;
		copy.sites = this.sites.map(s => s.copy());
		copy.created_at = this.created_at ? new Date(this.created_at.getTime()) : undefined;
		copy.modified_at = this.modified_at ? new Date(this.modified_at.getTime()) : undefined;
		copy.created_by = this.created_by;

		return copy;
	}
	/** Création depuis JSON brut */
	static fromJson(data: IDiagnostic): Diagnostic {
		const diag = new Diagnostic();

		diag.id_diagnostic = data.id_diagnostic;
		diag.nom = data.nom;
		diag.date_debut = data.date_debut ? new Date(data.date_debut) : undefined;
		diag.date_debut_str = data.date_debut ? moment(new Date(data.date_debut)).format("DD/MM/YYYY") : undefined;
		diag.date_fin = data.date_fin ? new Date(data.date_fin) : undefined;
		diag.id_organisme = data.id_organisme;
		diag.is_read_only = data.is_read_only;
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
			is_read_only: this.is_read_only,
			sites: this.sites.map(s => s.toJson()),
			created_at: this.created_at ? this.created_at.toISOString() : undefined,
			modified_at: this.modified_at ? this.modified_at.toISOString() : undefined,
			created_by: this.created_by,
		};
		return json;
	}
}