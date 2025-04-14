export class TypeNomenclature {
	id: number = 0;
	nom: string = "";
    mnemonique:string = "";
    
	copy(): TypeNomenclature {
		const copy = new TypeNomenclature();
		copy.id = this.id;
		copy.nom = this.nom;
        copy.mnemonique = this.mnemonique;
		return copy;
	}

	static fromJson(data: any): TypeNomenclature {
		const type = new TypeNomenclature();
		type.id = data.id;
		type.nom = data.nom;
        type.mnemonique = data.mnemonique;
		return type;
	}

	toJson(): any {
		return {
			id: this.id,
			nom: this.nom,
            mnemonique: this.mnemonique
		};
	}
}
