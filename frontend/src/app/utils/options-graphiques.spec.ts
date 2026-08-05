import { styleSerieRadar } from './options-graphiques';

/**
 * Le rendu d'un radar se juge à l'œil, mais la propriété qui le rend lisible
 * est vérifiable : deux séries voisines ne doivent jamais partager le même
 * motif de trait, sans quoi celle du dessus masque celle du dessous quand
 * leurs médianes coïncident (issue #110).
 */
describe('styleSerieRadar', () => {
  const NB_CATEGORIES = 5;

  it('donne un motif de trait distinct à chaque catégorie d’acteurs', () => {
    const motifs = Array.from({ length: NB_CATEGORIES }, (_, i) =>
      JSON.stringify(styleSerieRadar(i, '#000000').borderDash)
    );

    expect(new Set(motifs).size).toBe(NB_CATEGORIES);
  });

  it('donne un symbole de sommet distinct à chaque catégorie d’acteurs', () => {
    const symboles = Array.from({ length: NB_CATEGORIES }, (_, i) =>
      styleSerieRadar(i, '#000000').pointStyle
    );

    expect(new Set(symboles).size).toBe(NB_CATEGORIES);
  });

  it('n’attribue à aucune catégorie un trait continu, qui masquerait celles du dessous', () => {
    // Chart.js dessine de la dernière série à la première : la série 0 termine
    // au-dessus des autres, aucune ne peut donc être pleine tant qu'il reste
    // des séries en dessous.
    for (let i = 0; i < NB_CATEGORIES; i++) {
      expect(styleSerieRadar(i, '#000000').borderDash.length).toBeGreaterThan(0);
    }
  });

  it('élargit trait et sommets à mesure que la série s’enfonce, pour la laisser dépasser', () => {
    const epaisseurs = Array.from({ length: NB_CATEGORIES }, (_, i) =>
      styleSerieRadar(i, '#000000').borderWidth
    );
    const rayons = Array.from({ length: NB_CATEGORIES }, (_, i) =>
      styleSerieRadar(i, '#000000').pointRadius
    );

    for (let i = 1; i < NB_CATEGORIES; i++) {
      expect(epaisseurs[i]).toBeGreaterThan(epaisseurs[i - 1]);
      expect(rayons[i]).toBeGreaterThan(rayons[i - 1]);
    }
  });

  it('reprend la couleur fournie pour le trait comme pour les sommets', () => {
    const style = styleSerieRadar(2, '#009E73');

    expect(style.borderColor).toBe('#009E73');
    expect(style.pointBackgroundColor).toBe('#009E73');
  });

  it('boucle sur les motifs au-delà du nombre de styles définis', () => {
    expect(styleSerieRadar(7, '#000000').borderDash).toEqual(styleSerieRadar(0, '#000000').borderDash);
  });
});
