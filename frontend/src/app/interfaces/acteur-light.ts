import { Commune } from "@app/models/commune.model";
import { Diagnostic } from "@app/models/diagnostic.model";
import { Nomenclature } from "@app/models/nomenclature.model";


export interface ActeurLight {
  id_acteur: number;
  nom: string;
  prenom: string;
  fonction: string;
  structure: string;
  mail: string;
  telephone: string;
  is_acteur_economique: boolean;
  commune: Commune;
  diagnostic?: Diagnostic;
  categories?: Nomenclature[];
}