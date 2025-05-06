import { IDiagnostic } from "@app/interfaces/diagnostic.interface";
import { Site } from "./site.model";
import * as moment from 'moment';
import { Acteur } from "./acteur.model";

export class Diagnostic implements IDiagnostic {

	id_diagnostic: number = 0;
	nom: string = "Diagnostic";
	date_debut?:Date;
	date_debut_str: string ="";
	date_fin: Date | undefined;
	date_fin_str: string ="";
	date_rapport?:Date;
	date_rapport_str:string="";
	identite_createur:string="";
	sites: Site[] = [];
	is_read_only=false;
	id_organisme:number = 0
	created_at_str?: string = "";
	created_at?= new Date();
	modified_at: Date | undefined;
	created_by: number = 0;
	acteurs:Acteur[]=[]

	copy(): Diagnostic {
		const copy = new Diagnostic();

		copy.id_diagnostic = this.id_diagnostic;
		copy.nom = this.nom;
		copy.date_debut = this.date_debut ? new Date(this.date_debut.getTime()) : undefined;
		copy.date_fin = this.date_fin ? new Date(this.date_fin.getTime()) : undefined;
		copy.date_rapport = this.date_rapport ? new Date(this.date_rapport.getTime()) : undefined;
		copy.identite_createur = this.identite_createur;
		copy.sites = this.sites.map(s => s.copy());
		copy.acteurs = this.acteurs.map(a => a.copy());
		copy.created_at = this.created_at ? new Date(this.created_at.getTime()) : undefined;
		copy.modified_at = this.modified_at ? new Date(this.modified_at.getTime()) : undefined;
		copy.created_by = this.created_by;
		copy.is_read_only = this.is_read_only;
		copy.id_organisme = this.id_organisme;

		return copy;
	}
	/** Création depuis JSON brut */
	static fromJson(data: IDiagnostic): Diagnostic {
		const diag = new Diagnostic();
		if (!data) return diag;
		diag.id_diagnostic = data.id_diagnostic;
		diag.nom = data.nom;
		diag.date_debut = data.date_debut ? new Date(data.date_debut) : undefined;
		diag.date_debut_str = moment(new Date(data.date_debut!)).format("DD/MM/YYYY");
		diag.date_fin = data.date_fin ? new Date(data.date_fin) : undefined;
		diag.date_fin_str = moment(new Date(data.date_fin!)).format("DD/MM/YYYY");
		diag.date_rapport = data.date_fin ? new Date(data.date_rapport!) : undefined;
		diag.date_rapport_str = moment(new Date(data.date_rapport!)).format("DD/MM/YYYY");
		diag.identite_createur = data.identite_createur;
		diag.id_organisme = data.id_organisme;
		diag.is_read_only = data.is_read_only;
		diag.sites = (data.sites || []).map(s => Site.fromJson(s));
		diag.acteurs = (data.acteurs || []).map(a => Acteur.fromJson(a));
		diag.created_at = data.created_at ? new Date(data.created_at) : undefined;
		diag.created_at_str = moment(new Date(data.created_at!)).format("DD/MM/YYYY");
		diag.modified_at = data.modified_at ? new Date(data.modified_at) : undefined;
		diag.created_by = data.created_by;

		return diag;
	}

	/** Conversion en JSON (avec dates formatées ISO) */
	toJson(): IDiagnostic {
		const json: IDiagnostic = {
			...this,
			date_debut: this.date_debut ? this.date_debut : undefined,
			date_fin: this.date_fin ? this.date_fin : undefined,
			date_rapport: this.date_rapport ? this.date_rapport : undefined,
			sites: this.sites.map(s => s.toJson()),
			acteurs: this.acteurs.map(a => a.toJson()),
			created_at: this.created_at ? this.created_at.toISOString() : undefined,
			modified_at: this.modified_at ? this.modified_at.toISOString() : undefined,
		};
		return json;
	}
}