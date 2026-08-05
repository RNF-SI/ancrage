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

/**
 * Motifs de trait des séries d'un radar, un par catégorie d'acteurs.
 *
 * Deux catégories aux médianes identiques tracent exactement la même ligne :
 * l'une recouvrait l'autre, qui disparaissait du graphique comme du PNG inséré
 * dans les rapports. Des pointillés aux intervalles distincts laissent voir la
 * ligne du dessous dans les blancs de celle du dessus.
 *
 * Chart.js dessine les séries de la dernière à la première : la série 0 finit
 * au-dessus de toutes les autres. C'est donc elle qui doit être la plus
 * ajourée, et la dernière qui peut se permettre d'être continue.
 */
const MOTIFS_TRAIT_RADAR: number[][] = [
    [3, 5],
    [8, 6],
    [14, 5, 2, 5],
    [10, 4],
    [4, 4],
    [16, 5],
    [],
];

/**
 * Symboles des sommets, un par série. Ils prennent le relais des pointillés là
 * où deux lignes se confondent sur un seul axe, cas que le motif de trait ne
 * suffit pas toujours à départager.
 */
const SYMBOLES_POINT_RADAR = ['circle', 'rectRot', 'triangle', 'rect', 'star', 'crossRot', 'dash'] as const;

/**
 * Épaisseurs de trait, croissantes avec le rang. Les séries du dessous étant
 * les plus larges, elles dépassent de part et d'autre de celles tracées
 * par-dessus au lieu d'être entièrement masquées.
 */
const EPAISSEURS_TRAIT_RADAR = [2.5, 3, 3.4, 3.8, 4.2, 4.6, 5];

/** Rayons des sommets, croissants pour la même raison que les épaisseurs. */
const RAYONS_POINT_RADAR = [3, 3.5, 4, 4.5, 5, 5.5, 6];

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
 * Style d'une série de radar : couleur, motif de trait et symbole de sommet.
 *
 * La couleur seule ne suffit pas quand deux catégories obtiennent les mêmes
 * médianes — la ligne du dessus masque intégralement celle du dessous. Chaque
 * série reçoit donc aussi un motif et un symbole propres, qui la rendent
 * repérable même superposée, y compris sur une capture imprimée en noir et
 * blanc.
 */
export function styleSerieRadar(index: number, couleur: string) {
    const rang = index % MOTIFS_TRAIT_RADAR.length;

    return {
        borderColor: couleur,
        backgroundColor: 'transparent',
        borderWidth: EPAISSEURS_TRAIT_RADAR[rang],
        borderDash: MOTIFS_TRAIT_RADAR[rang],
        pointStyle: SYMBOLES_POINT_RADAR[rang],
        pointRadius: RAYONS_POINT_RADAR[rang],
        pointHoverRadius: RAYONS_POINT_RADAR[rang] + 2,
        pointBorderColor: couleur,
        pointBackgroundColor: couleur,
        fill: false,
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
