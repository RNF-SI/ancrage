import { GraphRepartition } from "@app/models/graph-repartition.model";

/** Palette Okabe-Ito, adaptée aux daltonismes. Indexée par le score (0 à 5). */
export const PALETTE_GRAPHIQUES = ['#0072B2', '#E69F00', '#009E73', '#F0E442', '#CC79A7', '#D55E00', '#999999'];

/** Gris neutre de la palette, jamais atteint par un score (qui va de 0 à 5). */
export const COULEUR_NEUTRE = PALETTE_GRAPHIQUES[6];

export const LIBELLE_REPONSE_NON_CLAIRE = "N'a pas exprimé de réponse claire";

/**
 * Couleur d'une part de camembert « Répartition des réponses ».
 *
 * « N'a pas exprimé de réponse claire » porte la valeur 3 en nomenclature :
 * indexée sur le score, elle prendrait le même jaune qu'une vraie note de 3 et
 * deviendrait indistinguable d'elle dans les visuels. On lui réserve le gris,
 * qui la signale comme une absence de position plutôt que comme un score.
 */
export function couleurReponse(reponse: GraphRepartition): string {
    const libelle = (reponse.reponse ?? '').replace(/’/g, "'").trim();

    if (libelle === LIBELLE_REPONSE_NON_CLAIRE) {
        return COULEUR_NEUTRE;
    }

    return PALETTE_GRAPHIQUES[reponse.score];
}
