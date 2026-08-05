/**
 * Options et export partagés par les composants de graphiques.
 *
 * Les titres vivaient dans le DOM, à côté du canvas : ils étaient tronqués par
 * la mise en page et absents des PNG exportés, puisque `exportChart` ne capture
 * que le canvas. On les place désormais dans la configuration Chart.js, où ils
 * sont dessinés dans le canvas — donc visibles en entier et exportés avec lui.
 */

import { Chart, Plugin } from 'chart.js';

/** Taille de police des entrées de légende, en pixels (défaut Chart.js : 12). */
const TAILLE_POLICE_LEGENDE = 11;

/** Côté de la pastille de couleur d'une entrée de légende, en pixels. */
const COTE_PASTILLE = 10;

/** Écart entre la pastille et son libellé, en pixels. */
const ESPACE_PASTILLE = 6;

/** Hauteur d'une ligne de légende, en pixels. */
const INTERLIGNE_LEGENDE = 15;

/** Écart entre deux entrées de légende, en pixels. */
const ESPACE_ENTRE_ENTREES = 4;

/** Marge autour du bloc de légende, en pixels. */
const MARGE_LEGENDE = 8;

/** Couleur du texte des légendes, alignée sur le défaut Chart.js. */
const COULEUR_TEXTE_LEGENDE = '#666';

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

/** Largeur approximative d'une ligne d'étiquette de radar, en caractères. */
const LARGEUR_LIGNE_ETIQUETTE = 22;

/** Taille de police des titres, en pixels. */
const TAILLE_POLICE_TITRE = 14;

/** Marge réservée de chaque côté d'un titre, en pixels. */
const MARGE_TITRE = 12;

/**
 * Découpe un texte en lignes, `tropLarge` décidant si une ligne déborde.
 *
 * Le critère est laissé à l'appelant : un nombre de caractères quand aucun
 * canvas n'est disponible, une largeur mesurée en pixels quand il l'est. Un mot
 * seul plus large qu'une ligne est coupé, sinon il dépasserait quand même.
 */
function decouperTexte(texte: string, tropLarge: (ligne: string) => boolean): string[] {
    const mots = (texte ?? '').trim().split(/\s+/).filter(Boolean);
    if (!mots.length) {
        return [''];
    }

    const lignes: string[] = [];
    let courante = '';

    const poser = (ligne: string) => {
        let reste = ligne;
        while (tropLarge(reste) && reste.length > 1) {
            let coupe = reste.length - 1;
            while (coupe > 1 && tropLarge(reste.slice(0, coupe))) {
                coupe--;
            }
            lignes.push(reste.slice(0, coupe));
            reste = reste.slice(coupe);
        }
        lignes.push(reste);
    };

    for (const mot of mots) {
        const candidate = courante ? `${courante} ${mot}` : mot;
        if (courante && tropLarge(candidate)) {
            poser(courante);
            courante = mot;
        } else {
            courante = candidate;
        }
    }
    poser(courante);

    return lignes;
}

/**
 * Découpe un titre long en plusieurs lignes.
 *
 * Chart.js accepte un tableau de chaînes pour `plugins.title.text` et en fait
 * autant de lignes. Sans ce découpage, un titre plus large que le canvas est
 * rogné aux deux extrémités. Le découpage au nombre de caractères ne vaut que
 * pour le premier rendu : `pluginTitreAdaptatif` le reprend ensuite sur la
 * largeur réellement disponible.
 */
export function decouperTitre(texte: string, largeur = LARGEUR_LIGNE_TITRE): string[] {
    return decouperTexte(texte, ligne => ligne.length > largeur);
}

/** Configuration du titre d'un graphique, découpé pour tenir dans le canvas. */
export function optionsTitre(texte: string) {
    return {
        display: true,
        text: decouperTitre(texte),
        // Conservé tel quel : le découpage au nombre de caractères est une
        // approximation, `pluginTitreAdaptatif` a besoin du texte d'origine
        // pour le refaire à chaque mise en page sur la largeur réelle.
        texteComplet: texte,
        font: { size: TAILLE_POLICE_TITRE },
        padding: { top: 4, bottom: 12 },
    };
}

/**
 * Redécoupe les titres sur la largeur réellement disponible.
 *
 * Le découpage de `decouperTitre` compte les caractères, sans savoir ni la
 * largeur du canvas ni celle des lettres : sur un cadre étroit, un titre censé
 * tenir dépassait quand même et Chart.js le rognait. Ce plugin le refait avant
 * chaque mise en page, en mesurant le texte avec la police du titre, ce qui
 * garantit un titre entier quelle que soit sa longueur ou la taille du cadre.
 */
export const pluginTitreAdaptatif: Plugin = {
    id: 'titreAdaptatif',

    beforeLayout(chart) {
        const titre = chart.options.plugins?.title as { text?: string | string[]; texteComplet?: string } | undefined;
        const largeur = chart.width - 2 * MARGE_TITRE;
        if (!titre?.texteComplet || largeur <= 0) {
            return;
        }

        const contexte = chart.ctx;
        contexte.save();
        contexte.font = `bold ${TAILLE_POLICE_TITRE}px ${Chart.defaults.font.family}`;
        titre.text = decouperTexte(titre.texteComplet, ligne => contexte.measureText(ligne).width > largeur);
        contexte.restore();
    },
};

/**
 * Étiquettes des axes d'un radar, repliées sur plusieurs lignes.
 *
 * Ces noms d'indicateurs sont écrits autour du radar, dans la marge qui reste
 * entre lui et le bord du canvas : les plus longs en sortaient et étaient
 * coupés net. Chart.js accepte un tableau de lignes en retour de `callback` et
 * rétrécit alors le radar pour leur faire place, au lieu de les rogner.
 */
export function optionsEtiquettesRadar() {
    return {
        font: { size: 14 },
        callback: (etiquette: string) => decouperTitre(etiquette, LARGEUR_LIGNE_ETIQUETTE),
    };
}

/**
 * Découpe les entrées de légende d'un graphique sur la largeur disponible.
 *
 * Les couleurs sont lues au même endroit que la légende native : les libellés
 * dans `data.labels`, les couleurs dans le premier jeu de données.
 */
function entreesLegende(chart: Chart): { lignes: string[]; couleur: string }[] {
    const libelles = (chart.data.labels ?? []) as string[];
    const couleurs = chart.data.datasets?.[0]?.backgroundColor as string[] | undefined;
    const largeur = chart.width - 2 * MARGE_LEGENDE - COTE_PASTILLE - ESPACE_PASTILLE;

    const contexte = chart.ctx;
    contexte.save();
    contexte.font = `${TAILLE_POLICE_LEGENDE}px ${Chart.defaults.font.family}`;
    const entrees = libelles.map((libelle, index) => ({
        lignes: decouperTexte(String(libelle ?? ''), ligne => contexte.measureText(ligne).width > largeur),
        couleur: couleurs?.[index] ?? COULEUR_TEXTE_LEGENDE,
    }));
    contexte.restore();

    return entrees;
}

/**
 * Légende dessinée sous le graphique, entrées repliées sur plusieurs lignes.
 *
 * La légende native de Chart.js écrit chaque entrée sur une seule ligne : les
 * libellés de réponses, qui montent à une cinquantaine de caractères, en
 * sortaient. Ils étaient donc tronqués — c'est la troncature signalée en #108.
 * Ce plugin la remplace : il réserve sous le graphique la hauteur nécessaire
 * puis y écrit chaque entrée repliée sur autant de lignes qu'il faut. Tout
 * reste dessiné dans le canvas, donc le PNG exporté montre exactement l'écran.
 *
 * Contrepartie assumée : cette légende n'est pas cliquable, alors que celle de
 * Chart.js permettait de masquer une part. Les camemberts de répartition ne
 * s'y prêtaient de toute façon pas, une part masquée faussant les proportions.
 */
export const pluginLegendeRepliee: Plugin = {
    id: 'legendeRepliee',

    beforeLayout(chart) {
        if (!(chart.options.plugins as { legendeRepliee?: { display?: boolean } })?.legendeRepliee?.display) {
            return;
        }

        const entrees = entreesLegende(chart);
        const nombreLignes = entrees.reduce((total, entree) => total + entree.lignes.length, 0);
        const hauteur = nombreLignes * INTERLIGNE_LEGENDE
            + entrees.length * ESPACE_ENTRE_ENTREES
            + 2 * MARGE_LEGENDE;

        const miseEnPage = chart.options.layout ?? (chart.options.layout = {});
        const marges = miseEnPage.padding;
        miseEnPage.padding = typeof marges === 'object' && marges !== null
            ? { ...marges, bottom: hauteur }
            : { top: 0, left: 0, right: 0, bottom: hauteur };
    },

    afterDraw(chart) {
        if (!(chart.options.plugins as { legendeRepliee?: { display?: boolean } })?.legendeRepliee?.display) {
            return;
        }

        const entrees = entreesLegende(chart);
        const contexte = chart.ctx;
        contexte.save();
        contexte.font = `${TAILLE_POLICE_LEGENDE}px ${Chart.defaults.font.family}`;
        contexte.textAlign = 'left';
        contexte.textBaseline = 'middle';

        let y = chart.chartArea.bottom + MARGE_LEGENDE + INTERLIGNE_LEGENDE / 2;
        for (const entree of entrees) {
            contexte.fillStyle = entree.couleur;
            contexte.fillRect(MARGE_LEGENDE, y - COTE_PASTILLE / 2, COTE_PASTILLE, COTE_PASTILLE);

            contexte.fillStyle = COULEUR_TEXTE_LEGENDE;
            for (const ligne of entree.lignes) {
                contexte.fillText(ligne, MARGE_LEGENDE + COTE_PASTILLE + ESPACE_PASTILLE, y);
                y += INTERLIGNE_LEGENDE;
            }
            y += ESPACE_ENTRE_ENTREES;
        }

        contexte.restore();
    },
};

/**
 * Options de légende d'un camembert : la légende native est éteinte au profit
 * de `pluginLegendeRepliee`, qui sait replier les libellés longs.
 */
export function optionsLegende() {
    return {
        legend: { display: false },
        legendeRepliee: { display: true },
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
