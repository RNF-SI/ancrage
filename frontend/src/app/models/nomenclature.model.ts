import { TypeNomenclature } from "./type-nomenclature.model";

export class Nomenclature {
	id_nomenclature: number = 1;
	libelle: string = "";
	/* typeSite?: TypeNomenclature | undefined= new TypeNomenclature(); */
	value: number = 1;
	mnemonique: string = "";
/* 	profilCognitif: TypeNomenclature = new TypeNomenclature();
	statutEntretien: TypeNomenclature = new TypeNomenclature();
	valeurReponse: TypeNomenclature = new TypeNomenclature;
	categorieActeur: TypeNomenclature = new TypeNomenclature();
	habitat: TypeNomenclature = new TypeNomenclature(); */

	/** Création depuis un objet JSON */
	static fromJson(data: any): Nomenclature {
		const nom = new Nomenclature();

		nom.id_nomenclature = data.id_nomenclature;
		nom.libelle = data.libelle;
		/* nom.typeSite = TypeNomenclature.fromJson(data.typeSite); */
		nom.value = data.value;
		nom.mnemonique = data.mnemonique;
		/* nom.profilCognitif = TypeNomenclature.fromJson(data.profilCognitif);
		nom.statutEntretien = TypeNomenclature.fromJson(data.statutEntretien);
		nom.habitat = TypeNomenclature.fromJson(data.habitat);
		nom.categorieActeur = TypeNomenclature.fromJson(data.categorieActeur);
		nom.valeurReponse = TypeNomenclature.fromJson(data.valeurReponse); */

		return nom;
	}

	/** Sérialisation vers JSON */
	toJson(): any {
		return {
			id_nomenclature: this.id_nomenclature,
			label: this.libelle,
			/* typeSite: this.typeSite.toJson(), */
			value: this.value,
			mnemonique: this.mnemonique,
			/* profilCognitif: this.profilCognitif.toJson(),
			statutEntretien: this.statutEntretien.toJson(),
			habitat: this.habitat.toJson(),
			categorieActeur: this.categorieActeur.toJson(),
			valeurReponse: this.valeurReponse.toJson() */
		};
	}
}
