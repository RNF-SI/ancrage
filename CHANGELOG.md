# Journal des versions

## v0.2.0 — 5 août 2026

Corrige trois défauts d'affichage des graphiques. Tous trois faisaient
disparaître une information pourtant présente en base, à l'écran comme dans les
PNG collés dans les rapports.

### Graphiques — données affichées mais invisibles

- **Barre absente quand la médiane vaut 1** — une barre est dessinée depuis la
  base de son axe, et l'axe des scores démarrait à 1 : une médiane de 1 donnait
  une barre de hauteur nulle. Le cas est fréquent sur les questions à trois
  niveaux, où 1 est la note la plus basse — sur la seule question « Evolution
  des échanges », 20 couples diagnostic × catégorie étaient concernés. L'axe part
  désormais de 0.
- **Lignes de radar superposées** (#110) — deux catégories d'acteurs aux mêmes
  médianes traçaient exactement le même polygone, et seule la couleur les
  distinguait : celle du dessus masquait intégralement celle du dessous. Chaque
  catégorie reçoit maintenant son motif de pointillés, son épaisseur et son
  symbole de sommet, repères qui restent lisibles sur une impression en noir et
  blanc. La légende reprend le pointillé de chaque catégorie.
- **Titres, étiquettes de radar et légendes tronqués** (#108) — les étiquettes
  d'axes des radars, écrites dans la marge entre le radar et le bord du cadre,
  étaient coupées net ; le découpage des titres comptait les caractères sans
  connaître la largeur du cadre ; le titre « Catégorie : … » des graphiques AFOM
  ne passait par aucun découpage ; et les entrées de légende des camemberts
  étaient raccourcies à 38 caractères, la légende de Chart.js n'écrivant chaque
  entrée que sur une ligne. Les trois premiers cas sont réglés par un repli sur
  plusieurs lignes, mesuré sur la largeur réellement disponible. Le quatrième
  l'est par une légende maison, qui réserve sous le graphique la hauteur
  nécessaire et replie les libellés longs : plus aucune limite de caractères.
  Tout reste dessiné dans le canvas, donc le PNG exporté montre exactement
  l'écran.

  Contrepartie : cette légende n'est plus cliquable, alors que celle de Chart.js
  permettait de masquer une part d'un clic. Les camemberts de répartition ne s'y
  prêtaient de toute façon pas, une part masquée faussant les proportions lues.

### Reste à traiter

- #108 et #110 sont livrées mais pas encore validées côté utilisateurs ; les
  points de contrôle sont dans `TESTS.md`.
- #88 — reformulation de questions du questionnaire. Suppose de trancher le
  sort du thème « Changement climatique et biodiversité », dont le libellé est
  codé en dur dans `routes/functions.py` pour déterminer quelles questions
  comptent dans le statut d'entretien.
- #89 — refonte des graphiques personnalisés, à spécifier.

## v0.1.0 — 29 juillet 2026

Première version taguée. Corrige onze retours d'utilisateurs, portant pour
l'essentiel sur des chiffres faux dans l'AFOM et les graphiques de synthèse.

### AFOM — comptage des mots-clés

- **Occurrences multipliées** (#105) — chaque enregistrement d'une réponse
  d'entretien recréait ses mots-clés au lieu de réutiliser les existants. Les
  lignes précédentes restaient en base sans lien vers aucune réponse et
  gonflaient les comptages, tandis que l'écran d'analyse réécrivait en base le
  total déjà faux, qui grossissait à chaque passage. Un mot-clé compte désormais
  une fois par **acteur distinct** l'ayant cité, même s'il l'a associé à
  plusieurs questions de son entretien.
- **Regroupements thématiques ignorés** (#107, doublon #103) — un mot-clé
  ressaisi n'était jamais rattaché au groupe existant portant le même nom : il
  s'affichait comme une barre indépendante à côté du thème sous lequel
  l'enquêteur l'avait déjà rangé.

Correction des données existantes : `backend/scripts/audit_mots_cles_fantomes.sql`
supprime les doublons, réactive les mots-clés désactivés collatéralement,
neutralise les compteurs périmés et rattache les mots-clés à leur thème.
Appliqué en production le 29 juillet, **1 639 occurrences en trop** éliminées sur
15 diagnostics.

### Graphiques de synthèse

- **Scores incohérents avec les entretiens** (#100) — « Réponse avec
  commentaire » (valeur 0) et « N'a pas exprimé de réponse claire » (valeur 3)
  entraient dans les médianes et les moyennes. Les acteurs n'ayant pas répondu
  tiraient les résultats vers le milieu de l'échelle.
- **Graphique global en désaccord avec le thématique** (#102) — le radar
  calculait une moyenne quand les barres calculaient une médiane. Les deux
  utilisent désormais la médiane. Une question sans réponse notée pour un groupe
  interrompt la ligne au lieu de tracer un point à zéro.
- **Non-réponse indistinguable d'une note moyenne** (#99) — portant la valeur 3
  en nomenclature, elle prenait la couleur d'un vrai score de 3. Le gris de la
  palette lui est réservé. Elle reste visible dans les camemberts, où elle a du
  sens, et n'est écartée que des calculs de score.

### Lisibilité et export des graphiques

- **Titres tronqués** (#106) et **absents des exports** (#87) — ils vivaient
  dans le DOM à côté du canvas. Ils sont désormais dessinés dans le graphique,
  découpés sur plusieurs lignes, et suivent donc le PNG exporté.
- **Légendes débordant du cadre** (#101) — les camemberts n'avaient aucune
  option ; un libellé plus large que le canvas en sortait et rendait l'export
  inexploitable. Les entrées sont raccourcies au-delà de 38 caractères, la
  légende passe sous le graphique, et l'infobulle conserve le libellé complet.
- Les PNG exportés ont un fond blanc au lieu d'être transparents.

### Exports de données

- **Extraction XLS inexploitable** (#104) — les 34 questions sont exportées, et
  les cellules vides remplacent les `NULL`.
- **Contenu de l'export complet** (#93) — ajout des scores, des questions de
  synthèse et d'en-têtes en français.

### Interne

- Environnement de développement local : `backend/scripts/setup_local_auth.py`
  et `local_geonature_global.sql` reconstituent le montage `postgres_fdw` vers
  la base des utilisateurs sans restaurer les 2,6 Go de GeoNature.
- Commandes `/fix-issue` et `/fix-lot` pour le traitement des issues.
- `CLAUDE.md` remis à jour.
- Les specs du sous-module `home-rnf` sont exclues de la compilation des tests.

### Reste à traiter

- #88 — reformulation de questions du questionnaire. Suppose de trancher le
  sort du thème « Changement climatique et biodiversité », dont le libellé est
  codé en dur dans `routes/functions.py` pour déterminer quelles questions
  comptent dans le statut d'entretien.
- #89 — refonte des graphiques personnalisés, à spécifier.
