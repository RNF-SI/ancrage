import { INomenclature } from "@app/interfaces/nomenclature.interface";
import { Question } from "./question.model";
import { IQuestion } from "@app/interfaces/question.interface";
import { MotCle } from "./mot-cle.model";


export class Nomenclature {
	id_nomenclature: number = 0;
	libelle: string = "";
	value: number = 0;
	mnemonique: string = "";
	questions?:Question[];
	mots_cles?:MotCle[];
	ordre?:number;

	/** Copie profonde */
	copy(): Nomenclature {
		const copy = new Nomenclature();

		copy.id_nomenclature = this.id_nomenclature;
		copy.libelle = this.libelle;
		copy.value = this.value;
		copy.mnemonique = this.mnemonique;
		copy.questions = this.questions?.map(q => q.copy()) || [];
		copy.mots_cles = this.mots_cles?.map(mc => mc.copy()) || [];
		copy.ordre = this.ordre;
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
		nom.mots_cles = (data.mots_cles || []).map(mc => MotCle.fromJson(mc));
		nom.ordre = data.ordre;
		return nom;
	}

	/** Sérialisation vers JSON */
	toJson(): INomenclature {
		return {
			...this,
			questions: this.questions?.map(q => q.toJson()) ?? undefined,
			/* mots_cles: this.mots_cles?.map(mc => mc.toJson()) ?? undefined, */
		};
	}
}
