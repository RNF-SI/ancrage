import { ISite } from "./site.interface";

export interface IDiagnostic {
    id_diagnostic: number;
    nom: string;
    date_debut_str?: string;
    date_debut ?: Date;
    date_fin: Date | undefined;
    is_read_only:boolean;
    id_organisme:number;
    sites?: ISite[];
    created_at ?: Date;
    created_at_str?: string;
    modified_at: Date | undefined;
    created_by: number;
}
