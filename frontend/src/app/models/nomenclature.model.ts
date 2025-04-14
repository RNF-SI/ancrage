import { TypeNomenclature } from "./type-nomenclature.model";

export class Nomenclature {
	id_nomenclature: number = 1;
	label: string = "";
	typeSite: TypeNomenclature = new TypeNomenclature();
	value: number = 1;
	mnemonique: string = "";
	profilCognitif: TypeNomenclature = new TypeNomenclature();
	statutEntretien: TypeNomenclature = new TypeNomenclature();
	valeurReponse: TypeNomenclature = new TypeNomenclature;
	categorieActeur: TypeNomenclature = new TypeNomenclature();
	habitat: TypeNomenclature = new TypeNomenclature();

	/** Copie profonde */
	copy(): Nomenclature {
		const copy = new Nomenclature();

		copy.id_nomenclature = this.id_nomenclature;
		copy.label = this.label;
		copy.typeSite = this.typeSite.copy();
		copy.value = this.value;
		copy.mnemonique = this.mnemonique;
		copy.profilCognitif = this.profilCognitif.copy();
		copy.statutEntretien = this.statutEntretien.copy();
		copy.habitat = this.habitat.copy();
		copy.valeurReponse = this.valeurReponse.copy();
		copy.categorieActeur = this.categorieActeur.copy();

		return copy;
	}

	/** Création depuis un objet JSON */
	static fromJson(data: any): Nomenclature {
		const nom = new Nomenclature();

		nom.id_nomenclature = data.id_nomenclature;
		nom.label = data.label;
		nom.typeSite = TypeNomenclature.fromJson(data.typeSite);
		nom.value = data.value;
		nom.mnemonique = data.mnemonique;
		nom.profilCognitif = TypeNomenclature.fromJson(data.profilCognitif);
		nom.statutEntretien = TypeNomenclature.fromJson(data.statutEntretien);
		nom.habitat = TypeNomenclature.fromJson(data.habitat);
		nom.categorieActeur = TypeNomenclature.fromJson(data.categorieActeur);
		nom.valeurReponse = TypeNomenclature.fromJson(data.valeurReponse);

		return nom;
	}

	/** Sérialisation vers JSON */
	toJson(): any {
		return {
			id_nomenclature: this.id_nomenclature,
			label: this.label,
			typeSite: this.typeSite.toJson(),
			value: this.value,
			mnemonique: this.mnemonique,
			profilCognitif: this.profilCognitif.toJson(),
			statutEntretien: this.statutEntretien.toJson(),
			habitat: this.habitat.toJson(),
			categorieActeur: this.categorieActeur.toJson(),
			valeurReponse: this.valeurReponse.toJson()
		};
	}
}
