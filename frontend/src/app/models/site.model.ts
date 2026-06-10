import { ISite } from "@app/interfaces/site.interface";
import { Diagnostic } from "./diagnostic.model";
import { Nomenclature } from "./nomenclature.model";
import { Departement } from "./departement.model";
import { GeoJsonPoint, GeoJsonSiteGeom } from "@app/interfaces/site.interface";

export class Site implements ISite {
	id_site: number = -1;
	nom: string = "";
	position_x: string = "";
	position_y: string = "";
	geom?: GeoJsonSiteGeom | string | null;
	geom_pt?: GeoJsonPoint | string | null;
	diagnostics: Diagnostic[] = [];
	habitats: Nomenclature[] = [];
	departements:Departement[] = [];
	id_inpn:string="";
	type: Nomenclature = new Nomenclature();
	created_at: Date | undefined;
	modified_at: Date | undefined;
	created_by: number = 0;
	modified_by: number = 0;
	selected=false;
	slug="";
	is_creation=false;

	copy(): Site {
		const copy = new Site();

		copy.id_site = this.id_site;
		copy.nom = this.nom;
		copy.position_x = this.position_x;
		copy.position_y = this.position_y;
		copy.geom = this.geom;
		copy.geom_pt = this.geom_pt;
		copy.diagnostics = this.diagnostics.map(d => d.copy());
		copy.habitats = this.habitats.map(h => h.copy());
		copy.type = this.type.copy();
		copy.created_at = this.created_at ? new Date(this.created_at.getTime()) : undefined;
		copy.modified_at = this.modified_at ? new Date(this.modified_at.getTime()) : undefined;
		copy.created_by = this.created_by;
		copy.modified_by = this.modified_by;
		copy.slug = this.slug;

		return copy;
	}
	private static pointFromPositions(positionX: string, positionY: string) {
		const lng = parseFloat(positionX);
		const lat = parseFloat(positionY);
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
			return null;
		}
		return { type: 'Point' as const, coordinates: [lng, lat] as [number, number] };
	}

	/** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
	static fromJson(data: ISite): Site {
		const site = new Site();

		site.id_site = data.id_site;
		site.nom = data.nom;
		site.position_x = data.position_x;
		site.position_y = data.position_y;
		site.geom = data.geom ?? null;
		site.geom_pt = data.geom_pt ?? Site.pointFromPositions(data.position_x, data.position_y);
		site.id_inpn = data.id_inpn;
		site.diagnostics = (data.diagnostics || []).map(d => Diagnostic.fromJson(d));
		site.habitats = (data.habitats || []).map(h => Nomenclature.fromJson(h));
		site.type = Nomenclature.fromJson(data.type);
		site.departements = (data.departements || []).map(h => Departement.fromJson(h));
		site.created_at = data.created_at ? new Date(data.created_at) : undefined;
		site.modified_at = data.modified_at ? new Date(data.modified_at) : undefined;
		site.created_by = data.created_by;
		site.modified_by = data.modified_by;
		site.slug = data.slug;

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
			modified_at: this.modified_at ? new Date(this.modified_at) : undefined			
		};
	
		return json;
	}
}
