import { Site } from "@app/models/site.model";
import { ActeurLight } from "./acteur-light";

export interface DiagnosticLight {
    id_diagnostic: number;
    nom: string;
    date_debut?: Date;
    date_fin?: Date;
    date_rapport?: Date;
    identite_createur: string;
    id_organisme: number;
    created_by: number;
    created_at?: Date;
    modified_at?: Date;
    is_read_only: boolean;
    sites: Site[];
    acteurs: ActeurLight[];
  }
