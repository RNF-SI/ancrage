import { IDiagnostic } from "@app/interfaces/diagnostic.interface";
import { Site } from "./site.model";

export class Diagnostic implements IDiagnostic {

	id_diagnostic: number = -1;
	nom: string = "Diagnostic";
	date_debut: Date | undefined;
	date_fin: Date | undefined;
	rapport: string = "";
	sites: Site[] = [];
	created_at: Date | undefined;
	modified_at: Date | undefined;
	created_by: number = 0;

	/** Copie profonde de Diagnostic */
	copy(): Diagnostic {
		const copy = new Diagnostic();

		copy.id_diagnostic = this.id_diagnostic;
		copy.nom = this.nom;
		copy.date_debut = this.date_debut ? new Date(this.date_debut.getTime()) : undefined;
		copy.date_fin = this.date_fin ? new Date(this.date_fin.getTime()) : undefined;
		copy.rapport = this.rapport;
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
			date_debut: this.date_debut ? this.date_debut.toISOString() : undefined,
			date_fin: this.date_fin ? this.date_fin.toISOString() : undefined,
			rapport: this.rapport,
			site: this.sites.map(s => s.toJson()),
			created_at: this.created_at ? this.created_at.toISOString() : undefined,
			modified_at: this.modified_at ? this.modified_at.toISOString() : undefined,
			created_by: this.created_by,
		};
		return json;
	}
}