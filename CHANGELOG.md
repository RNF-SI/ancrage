# Journal des versions

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
