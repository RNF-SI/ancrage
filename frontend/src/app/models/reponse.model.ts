import { Entretien } from "./entretien.model";
import { MotCle } from "./mot-cle.model";
import { Nomenclature } from "./nomenclature.model";

export class Reponse {
    id_reponse=1;
    valeurReponse = new Nomenclature();
    entretien = new Entretien();
    motCle = new MotCle();
}
