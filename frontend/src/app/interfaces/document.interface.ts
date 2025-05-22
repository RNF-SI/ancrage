import { Diagnostic } from "@app/models/diagnostic.model";

export interface IDocument{
    id_document:number;
    nom:string;
    diagnostic:Diagnostic;
}