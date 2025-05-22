import { IDocument } from "@app/interfaces/document.interface";
import { Diagnostic } from "./diagnostic.model";

export class Document {
    id_document=1;
    nom="";
    diagnostic = new Diagnostic();

    copy(): Document{
            const copy = new Document();
            copy.id_document = this.id_document;
            copy.nom = this.nom;
            copy.diagnostic = this.diagnostic?.copy() || new Diagnostic();
    
            return copy;
    }
    
    /** Création depuis un JSON brut (avec reconversion des objets internes et dates) */
    static fromJson(data: IDocument): Document {
        
        const document = new Document();
        if(!data) return document;
        document.id_document = data.id_document;
        document.nom = data.nom;
        document.diagnostic = Diagnostic.fromJson(data.diagnostic!) || new Diagnostic();
        return document;
    }

    toJson(): IDocument {
        const json: IDocument = {
            ...this,
            region: this.diagnostic?.copy()

        };

        return json;
    }
}
