/**
 * Options et export partagés par les composants de graphiques.
 *
 * Les titres vivaient dans le DOM, à côté du canvas : ils étaient tronqués par
 * la mise en page et absents des PNG exportés, puisque `exportChart` ne capture
 * que le canvas. On les place désormais dans la configuration Chart.js, où ils
 * sont dessinés dans le canvas — donc visibles en entier et exportés avec lui.
 */

/** Longueur au-delà de laquelle une entrée de légende déborde du cadre. */
const LONGUEUR_MAX_LEGENDE = 38;

/** Largeur approximative d'une ligne de titre, en caractères. */
const LARGEUR_LIGNE_TITRE = 55;

/**
 * Découpe un titre long en plusieurs lignes.
 *
 * Chart.js accepte un tableau de chaînes pour `plugins.title.text` et en fait
 * autant de lignes. Sans ce découpage, un titre plus large que le canvas est
 * rogné aux deux extrémités.
 */
export function decouperTitre(texte: string, largeur = LARGEUR_LIGNE_TITRE): string[] {
    const mots = (texte ?? '').trim().split(/\s+/).filter(Boolean);
    if (!mots.length) {
        return [''];
    }

    const lignes: string[] = [];
    let courante = '';

    for (const mot of mots) {
        const candidate = courante ? `${courante} ${mot}` : mot;
        if (courante && candidate.length > largeur) {
            lignes.push(courante);
            courante = mot;
        } else {
            courante = candidate;
        }
    }
    lignes.push(courante);

    return lignes;
}

/** Configuration du titre d'un graphique, découpé pour tenir dans le canvas. */
export function optionsTitre(texte: string) {
    return {
        display: true,
        text: decouperTitre(texte),
        font: { size: 14 },
        padding: { top: 4, bottom: 12 },
    };
}

/**
 * Raccourcit une entrée de légende trop longue.
 *
 * Une entrée plus large que le canvas en sort et rend le PNG exporté
 * inexploitable (question « nature des liens », dont les réponses font jusqu'à
 * une cinquantaine de caractères). Le libellé complet reste lisible dans
 * l'infobulle au survol.
 */
export function tronquerLegende(texte: string, longueur = LONGUEUR_MAX_LEGENDE): string {
    const propre = (texte ?? '').trim();
    return propre.length > longueur ? `${propre.slice(0, longueur - 1).trimEnd()}…` : propre;
}

/**
 * Légende placée sous le graphique, où elle dispose de toute la largeur et se
 * répartit sur plusieurs lignes au lieu de déborder.
 */
export function optionsLegende() {
    return {
        display: true,
        position: 'bottom' as const,
        labels: { boxWidth: 12, padding: 8 },
    };
}

/**
 * Exporte un canvas en PNG.
 *
 * Un canvas Chart.js est transparent : tel quel, le PNG s'affiche sur fond
 * sombre ou damier une fois inséré dans un rapport. On le recompose donc sur
 * un fond blanc.
 */
export function exporterCanvasPng(classe: string, titre: string): void {
    const canvas = document.querySelector('.' + classe) as HTMLCanvasElement | null;
    if (!canvas) {
        return;
    }

    const surFondBlanc = document.createElement('canvas');
    surFondBlanc.width = canvas.width;
    surFondBlanc.height = canvas.height;

    const contexte = surFondBlanc.getContext('2d');
    if (contexte) {
        contexte.fillStyle = '#ffffff';
        contexte.fillRect(0, 0, surFondBlanc.width, surFondBlanc.height);
        contexte.drawImage(canvas, 0, 0);
    }

    const lien = document.createElement('a');
    lien.href = (contexte ? surFondBlanc : canvas).toDataURL('image/png');
    lien.download = `${titre}.png`;
    lien.click();
}
