import { INomenclature } from "@app/interfaces/nomenclature.interface";
import { Question } from "./question.model";
import { IQuestion } from "@app/interfaces/question.interface";


export class Nomenclature {
	id_nomenclature: number = 0;
	libelle: string = "";
	value: number = 1;
	mnemonique: string = "";
	questions?:Question[];


	/** Copie profonde */
	copy(): Nomenclature {
		const copy = new Nomenclature();

		copy.id_nomenclature = this.id_nomenclature;
		copy.libelle = this.libelle;
		copy.value = this.value;
		copy.mnemonique = this.mnemonique;
		copy.questions = this.questions?.map(q => q.copy()) || [];

		return copy;
	}

	/** Création depuis un objet JSON */
	static fromJson(data: INomenclature): Nomenclature {
		
		const nom = new Nomenclature();
		if (!data) return nom;
		
		nom.id_nomenclature = data.id_nomenclature;
		nom.libelle = data.libelle;
		nom.value = data.value;
		nom.mnemonique = data.mnemonique;
		nom.questions = (data.questions || []).map(q => Question.fromJson(q));
		return nom;
	}

	/** Sérialisation vers JSON */
	toJson(): INomenclature {
		return {
			...this,
			questions: this.questions?.map(q => q.toJson()) ?? undefined,
		};
	}
}
