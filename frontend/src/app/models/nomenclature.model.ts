import { INomenclature } from "@app/interfaces/nomenclature.interface";


export class Nomenclature {
	id_nomenclature: number = 1;
	libelle: string = "";
	value: number = 1;
	mnemonique: string = "";


	/** Copie profonde */
	copy(): Nomenclature {
		const copy = new Nomenclature();

		copy.id_nomenclature = this.id_nomenclature;
		copy.libelle = this.libelle;
		
		copy.value = this.value;
		copy.mnemonique = this.mnemonique;

		return copy;
	}

	/** Création depuis un objet JSON */
	static fromJson(data: any): Nomenclature {
		
		const nom = new Nomenclature();
		if (!data) return nom;
		
		nom.id_nomenclature = data.id_nomenclature;
		nom.libelle = data.libelle;
		nom.value = data.value;
		nom.mnemonique = data.mnemonique;
		return nom;
	}

	/** Sérialisation vers JSON */
	toJson(): INomenclature {
		return {
			id_nomenclature: this.id_nomenclature,
			libelle: this.libelle,
			value: this.value,
			mnemonique: this.mnemonique,

		};
	}
}
