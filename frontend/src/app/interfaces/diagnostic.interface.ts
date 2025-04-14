import { Site } from "@app/models/site.model";

export interface IDiagnostic {
    id_diagnostic: number;
    nom: string;
    date_debut: Date | undefined;
    date_fin: Date | undefined;
    rapport: string;
    sites: Site[];
    created_at: Date | undefined;
    modified_at: Date | undefined;
    created_by: number;
}
