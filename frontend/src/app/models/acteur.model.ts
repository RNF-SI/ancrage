import { IActeur } from "@app/interfaces/acteur.interface";
import { Commune } from "./commune.model";
import { Diagnostic } from "./diagnostic.model";
import { Nomenclature } from "./nomenclature.model";
import { Reponse } from "./reponse.model";

export class Acteur implements IActeur{
    id_acteur:number = 0;
    nom:string="";
    prenom:string="";
    fonction:string="";
    telephone:string="";
    mail:string="";
    commune:Commune = new Commune();
    profil?:Nomenclature;
    structure="";
    statut_entretien?: Nomenclature;
    diagnostic?:Diagnostic;
    categories?: Nomenclature[];
    created_at:Date | undefined;
    modified_at:Date | undefined;
    created_by:number=0;
    modified_by:number=0;
    selected = false;
    reponses?:Reponse[];
    slug = "";
    is_deleted = false;

    /** Copie profonde de l'objet */
    copy(): Acteur {
        const copy = new Acteur();

        copy.id_acteur = this.id_acteur;
        copy.nom = this.nom;
        copy.prenom = this.prenom;
        copy.fonction = this.fonction;
        copy.telephone = this.telephone;
        copy.mail = this.mail;
        copy.statut_entretien = this.statut_entretien?.copy();
        copy.profil = this.profil?.copy();
        copy.commune = this.commune?.copy();
        copy.structure = this.structure;
        copy.diagnostic = this.diagnostic?.copy();
        copy.categories = this.categories?.map(c => c.copy()) || [];
        copy.reponses = this.reponses?.map(r => r.copy()) || [];
        copy.created_at = this.created_at ? new Date(this.created_at.getTime()) : undefined;
        copy.modified_at = this.modified_at ? new Date(this.modified_at.getTime()) : undefined;
        copy.created_by = this.created_by;
        copy.modified_by = this.modified_by;
        copy.slug = this.slug;
        copy.is_deleted = this.is_deleted;

        return copy;
    }

    /** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
    static fromJson(data: IActeur): Acteur {
        const acteur = new Acteur();

        acteur.id_acteur = data.id_acteur;
        acteur.nom = data.nom;
        acteur.prenom = data.prenom;
        acteur.fonction = data.fonction;
        acteur.telephone = data.telephone;
        acteur.mail = data.mail;
        acteur.statut_entretien = Nomenclature.fromJson(data.statut_entretien!);
        acteur.profil = Nomenclature.fromJson(data.profil!)
        acteur.commune = Commune.fromJson(data.commune!);
        acteur.structure = data.structure;
        acteur.diagnostic = data.diagnostic ? Diagnostic.fromJson(data.diagnostic!) : undefined;
        acteur.categories = (data.categories || []).map(c => Nomenclature.fromJson(c));
        acteur.reponses = (data.reponses || []).map(r => Reponse.fromJson(r));
        acteur.created_at = data.created_at ? new Date() : undefined;
        acteur.modified_at = data.modified_at ? new Date() : undefined;
        acteur.created_by = data.created_by;
        acteur.modified_by = data.modified_by;
        acteur.slug = data.slug;
        acteur.is_deleted = data.is_deleted;

        return acteur;
    }

    /** Conversion en JSON, sans id_site si non voulu */
    toJson(): IActeur {
        return {
            ...this,
            statut_entretien: this.statut_entretien ? this.statut_entretien.toJson() : undefined,
            profil: this.profil ? this.profil.toJson() : undefined,
            commune: this.commune ? this.commune.toJson() : undefined,
            diagnostic: this.diagnostic ? this.diagnostic.toJson() : undefined,
            categories: this.categories ? this.categories.map(c => c.toJson()) : [],
            reponses: this.reponses ? this.reponses.map(r => r.toJson()) : [],
            created_at: this.created_at ? new Date() : undefined,
            modified_at: this.modified_at ? new Date() : undefined
        };
    }
}
