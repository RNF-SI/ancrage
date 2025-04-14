import { IActeur } from "@app/interfaces/acteur.interface";
import { Commune } from "./commune.model";
import { Diagnostic } from "./diagnostic.model";
import { Nomenclature } from "./nomenclature.model";

export class Acteur implements IActeur{
    id_acteur:number = 1;
    nom:string="";
    prenom:string="";
    statut:string="";
    telephone:string="06 06 06 06 06";
    mail:string="mail@mail.com";
    commune:Commune=new Commune();
    profilCognitif= new Nomenclature();
    isActeurEconomique:boolean=false;
    structure="";
    statut_entretien = new Nomenclature();
    diagnostic = new Diagnostic();
    categories: Nomenclature[] = [];
    created_at:Date | undefined;
    modified_at:Date | undefined;
    created_by:number=0;
    modified_by:number=0;

    /** Copie profonde de l'objet */
    copy(): Acteur {
        const copy = new Acteur();

        copy.id_acteur = this.id_acteur;
        copy.nom = this.nom;
        copy.prenom = this.prenom;
        copy.statut = this.statut;
        copy.telephone = this.telephone;
        copy.mail = this.mail;
        copy.statut_entretien = this.statut_entretien.copy();
        copy.commune = this.commune.copy();
        copy.isActeurEconomique = this.isActeurEconomique;
        copy.structure = this.structure;
        copy.diagnostic = this.diagnostic.copy();
        copy.categories = this.categories.map(c => c.copy());
        copy.created_at = this.created_at ? new Date(this.created_at.getTime()) : undefined;
        copy.modified_at = this.modified_at ? new Date(this.modified_at.getTime()) : undefined;
        copy.created_by = this.created_by;
        copy.modified_by = this.modified_by;

        return copy;
    }

    /** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
    static fromJson(data: IActeur): Acteur {
        const acteur = new Acteur();

        acteur.id_acteur = data.id_acteur;
        acteur.nom = data.nom;
        acteur.prenom = data.prenom;
        acteur.statut = data.statut;
        acteur.telephone = data.telephone;
        acteur.mail = data.mail;
        acteur.statut_entretien = Nomenclature.fromJson(data.statut_entretien);
        acteur.commune = Commune.fromJson(data.commune);
        acteur.isActeurEconomique = data.isActeurEconomique;
        acteur.structure = data.structure;
        acteur.diagnostic = Diagnostic.fromJson(data.diagnostic);
        acteur.categories = (data.categories || []).map(c => Nomenclature.fromJson(c));
        acteur.created_at = data.created_at ? new Date(data.created_at.getTime()) : undefined;
        acteur.modified_at = data.modified_at ? new Date(data.modified_at.getTime()) : undefined;
        acteur.created_by = data.created_by;
        acteur.modified_by = data.modified_by;

        return acteur;
    }

/** Conversion en JSON, sans id_site si non voulu */
    toJson(): IActeur {
        const json: IActeur = {
            ...this,
            id_acteur: this.id_acteur,
            nom: this.nom,
            prenom: this.prenom,
            statut: this.statut,
            telephone: this.telephone,
            mail: this.mail,
            statut_entretien: this.statut_entretien.copy(),
            commune: this.commune.copy(),
            isActeurEconomique: this.isActeurEconomique,
            structure: this.structure,
            diagnostic: this.diagnostic.copy(),
            categories: this.categories.map(c=> c.copy()),
            created_at: this.created_at ? new Date(this.created_at.getTime()) : undefined,
            modified_at: this.modified_at ? new Date(this.modified_at.getTime()) : undefined,
            created_by: this.created_by,
            modified_by: this.modified_by
        };
    
        return json;
    }
}
