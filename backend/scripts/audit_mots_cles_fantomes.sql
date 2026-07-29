-- Mots-clés fantômes qui gonflaient le comptage AFOM (issue #105).
-- Prévu pour DBeaver : exécuter chaque section SÉPARÉMENT (Ctrl+Entrée sur la
-- requête), surtout pas le fichier entier d'un coup — la section 4 écrit en base.
--
-- Contexte : avant le correctif, chaque enregistrement d'une réponse d'entretien
-- recréait une ligne dans t_mots_cles au lieu de réutiliser l'existante. Les
-- lignes précédentes restaient en base sans être liées à aucune réponse, avec
-- nombre = 1. L'écran AFOM additionnait les lignes de même nom, et l'écran
-- d'analyse réécrivait en base ce total déjà gonflé (nombre), qui était re-sommé
-- au passage suivant : l'erreur s'amplifiait à chaque aller-retour.
--
-- Le bug est dans le chemin d'enregistrement commun à tous les entretiens :
-- TOUS les diagnostics sont potentiellement concernés, pas seulement celui
-- d'où vient la remontée. D'où la section 1, qui donne l'ampleur réelle.
--
-- Équivalent Python (hors DBeaver) : backend/scripts/cleanup_mots_cles_orphelins.py


-- =====================================================================
-- 1) BILAN SUR TOUTE LA BASE (lecture seule) — un diagnostic par ligne
--    Aucune valeur à remplacer.
--    ecart = occurrences fantômes actuellement affichées aux utilisateurs.
-- =====================================================================
WITH mc AS (
    SELECT m.id_mot_cle,
           m.diagnostic_id,
           lower(btrim(m.nom)) AS cle_nom,
           m.categorie_id,
           coalesce(m.nombre, 0) AS nombre
    FROM t_mots_cles m
    WHERE m.mots_cles_groupe_id IS NULL
),
liens AS (
    SELECT DISTINCT c.mot_cle_id, r.acteur_id
    FROM cor_reponses_mots_cles c
    JOIN t_reponses r ON r.id_reponse = c.reponse_id
),
lignes AS (
    SELECT mc.diagnostic_id, mc.cle_nom, mc.categorie_id,
           count(*) AS lignes_en_base,
           count(*) FILTER (
               WHERE NOT EXISTS (SELECT 1 FROM liens l WHERE l.mot_cle_id = mc.id_mot_cle)
           ) AS lignes_fantomes,
           sum(mc.nombre) AS affiche_avant
    FROM mc
    GROUP BY mc.diagnostic_id, mc.cle_nom, mc.categorie_id
),
acteurs AS (
    SELECT mc.diagnostic_id, mc.cle_nom, mc.categorie_id,
           count(DISTINCT l.acteur_id) AS affiche_apres
    FROM mc
    JOIN liens l ON l.mot_cle_id = mc.id_mot_cle
    GROUP BY mc.diagnostic_id, mc.cle_nom, mc.categorie_id
)
SELECT d.id_diagnostic,
       d.nom AS diagnostic,
       d.annee,
       (SELECT count(*) FROM t_acteurs a WHERE a.diagnostic_id = d.id_diagnostic) AS nb_acteurs,
       sum(lignes.lignes_en_base)                        AS lignes,
       sum(lignes.lignes_fantomes)                       AS fantomes,
       sum(lignes.affiche_avant)                         AS affiche_avant,
       sum(coalesce(acteurs.affiche_apres, 0))           AS affiche_apres,
       sum(lignes.affiche_avant) - sum(coalesce(acteurs.affiche_apres, 0)) AS ecart
FROM lignes
JOIN t_diagnostics d ON d.id_diagnostic = lignes.diagnostic_id
LEFT JOIN acteurs
       ON acteurs.diagnostic_id = lignes.diagnostic_id
      AND acteurs.cle_nom = lignes.cle_nom
      AND acteurs.categorie_id IS NOT DISTINCT FROM lignes.categorie_id
GROUP BY d.id_diagnostic, d.nom, d.annee
HAVING sum(lignes.lignes_fantomes) > 0
ORDER BY ecart DESC, d.id_diagnostic;


-- =====================================================================
-- 2) DÉTAIL d'un diagnostic (lecture seule) — un mot-clé par ligne
--    Remplacer le 94 ci-dessous par le diagnostic à inspecter.
-- =====================================================================
WITH cible AS (
    SELECT 94 AS id_diagnostic          -- <<< diagnostic à inspecter
),
mc AS (
    SELECT m.id_mot_cle, m.diagnostic_id,
           lower(btrim(m.nom)) AS cle_nom,
           m.categorie_id,
           coalesce(m.nombre, 0) AS nombre
    FROM t_mots_cles m
    WHERE m.diagnostic_id IN (SELECT id_diagnostic FROM cible)
      AND m.mots_cles_groupe_id IS NULL
),
liens AS (
    SELECT DISTINCT c.mot_cle_id, r.acteur_id
    FROM cor_reponses_mots_cles c
    JOIN t_reponses r ON r.id_reponse = c.reponse_id
),
lignes AS (
    SELECT mc.cle_nom, mc.categorie_id,
           count(*) AS lignes_en_base,
           count(*) FILTER (
               WHERE NOT EXISTS (SELECT 1 FROM liens l WHERE l.mot_cle_id = mc.id_mot_cle)
           ) AS lignes_fantomes,
           sum(mc.nombre) AS affiche_avant
    FROM mc
    GROUP BY mc.cle_nom, mc.categorie_id
),
acteurs AS (
    SELECT mc.cle_nom, mc.categorie_id,
           count(DISTINCT l.acteur_id) AS affiche_apres
    FROM mc
    JOIN liens l ON l.mot_cle_id = mc.id_mot_cle
    GROUP BY mc.cle_nom, mc.categorie_id
)
SELECT lignes.cle_nom                     AS mot_cle,
       n.libelle                          AS categorie,
       lignes.lignes_en_base,
       lignes.lignes_fantomes,
       lignes.affiche_avant,
       coalesce(acteurs.affiche_apres, 0) AS affiche_apres
FROM lignes
LEFT JOIN acteurs
       ON acteurs.cle_nom = lignes.cle_nom
      AND acteurs.categorie_id IS NOT DISTINCT FROM lignes.categorie_id
LEFT JOIN t_nomenclatures n ON n.id_nomenclature = lignes.categorie_id
WHERE lignes.lignes_en_base > 1
   OR lignes.affiche_avant <> coalesce(acteurs.affiche_apres, 0)
ORDER BY lignes.affiche_avant - coalesce(acteurs.affiche_apres, 0) DESC,
         lignes.cle_nom;


-- =====================================================================
-- 3) Retrouver un diagnostic par son nom ou son site
-- =====================================================================
SELECT d.id_diagnostic, d.nom AS diagnostic, s.nom AS site, d.annee
FROM t_diagnostics d
LEFT JOIN cor_sites_diagnostics csd ON csd.diagnostic_id = d.id_diagnostic
LEFT JOIN t_sites s ON s.id_site = csd.site_id
WHERE d.nom ILIKE '%puydarrieux%' OR s.nom ILIKE '%puydarrieux%'
ORDER BY d.id_diagnostic;


-- =====================================================================
-- 4) NETTOYAGE — sélectionner et exécuter TOUTE la section d'un bloc.
--    Un seul endroit à adapter : la table « cible » ci-dessous.
--    Supprime uniquement les mots-clés orphelins FAISANT DOUBLON avec un
--    mot-clé réellement cité en entretien, dans le MÊME diagnostic. Un
--    mot-clé sans aucun jumeau lié (ajouté à la main dans l'écran d'analyse,
--    ou non-réponse type « aucun ») est CONSERVÉ tel quel.
-- =====================================================================
BEGIN;

DROP TABLE IF EXISTS cible;
CREATE TEMP TABLE cible AS
-- Un seul diagnostic :
SELECT 94 AS id_diagnostic;
-- Toute la base — commenter la ligne ci-dessus et décommenter celle-ci :
-- SELECT id_diagnostic FROM t_diagnostics;

DROP TABLE IF EXISTS mots_cles_fantomes;
CREATE TEMP TABLE mots_cles_fantomes AS
SELECT m.id_mot_cle, m.diagnostic_id, m.nom, m.nombre
FROM t_mots_cles m
WHERE m.diagnostic_id IN (SELECT id_diagnostic FROM cible)
  -- non lié à une réponse
  AND NOT EXISTS (
      SELECT 1 FROM cor_reponses_mots_cles c WHERE c.mot_cle_id = m.id_mot_cle
  )
  -- pas parent d'un groupe créé pendant l'analyse
  AND NOT EXISTS (
      SELECT 1 FROM t_mots_cles e WHERE e.mots_cles_groupe_id = m.id_mot_cle
  )
  -- fait doublon avec un mot-clé réellement cité en entretien
  AND EXISTS (
      SELECT 1
      FROM t_mots_cles m2
      JOIN cor_reponses_mots_cles c2 ON c2.mot_cle_id = m2.id_mot_cle
      WHERE m2.diagnostic_id = m.diagnostic_id
        AND lower(btrim(m2.nom)) = lower(btrim(m.nom))
  );

SELECT count(*) AS a_supprimer FROM mots_cles_fantomes;
SELECT diagnostic_id, count(*) AS a_supprimer
FROM mots_cles_fantomes GROUP BY diagnostic_id ORDER BY diagnostic_id;

-- Réactivation des vraies lignes désactivées collatéralement.
-- enregistrer_afoms (/diagnostic/afom/update) désactive tout mot-clé absent du
-- payload de l'écran d'analyse. Cet écran affichait l'entrée fusionnée portant
-- l'identifiant du fantôme : les sauvegardes ont donc désactivé les vraies
-- lignes au profit des doublons. On ne réactive QUE celles dont un jumeau
-- fantôme est resté actif — signe que l'enquêteur voulait bien garder ce
-- mot-clé. Une ligne désactivée sans jumeau actif a été retirée volontairement
-- de l'AFOM et n'est pas touchée.
-- À exécuter AVANT la suppression : la règle s'appuie sur le fantôme encore actif.
UPDATE t_mots_cles m
SET is_actif = true
WHERE m.diagnostic_id IN (SELECT id_diagnostic FROM cible)
  AND m.mots_cles_groupe_id IS NULL
  AND NOT m.is_actif
  AND EXISTS (
      SELECT 1 FROM cor_reponses_mots_cles c WHERE c.mot_cle_id = m.id_mot_cle
  )
  AND EXISTS (
      SELECT 1
      FROM t_mots_cles j
      WHERE j.diagnostic_id = m.diagnostic_id
        AND j.mots_cles_groupe_id IS NULL
        AND j.is_actif
        AND lower(btrim(j.nom)) = lower(btrim(m.nom))
        AND j.categorie_id IS NOT DISTINCT FROM m.categorie_id
        AND NOT EXISTS (
            SELECT 1 FROM cor_reponses_mots_cles c2 WHERE c2.mot_cle_id = j.id_mot_cle
        )
  );

DELETE FROM t_afom      WHERE mot_cle_id IN (SELECT id_mot_cle FROM mots_cles_fantomes);
DELETE FROM t_mots_cles WHERE id_mot_cle IN (SELECT id_mot_cle FROM mots_cles_fantomes);

-- Compteurs périmés : l'écran d'analyse (/diagnostic/afom/update) réécrivait en
-- base le nombre AFFICHÉ, déjà gonflé — d'où des lignes à nombre = 5 pour une
-- seule occurrence réelle. Le code corrigé les ignore au profit du comptage
-- issu des entretiens ; on les neutralise pour qu'ils ne puissent pas resurgir.
-- Volontairement limité aux lignes LIÉES à une réponse : les mots-clés sans
-- aucun lien conservent leur nombre et restent affichés tels quels.
UPDATE t_mots_cles m
SET nombre = NULL
WHERE m.diagnostic_id IN (SELECT id_diagnostic FROM cible)
  AND EXISTS (
      SELECT 1 FROM cor_reponses_mots_cles c WHERE c.mot_cle_id = m.id_mot_cle
  );

-- Recalcul de l'AFOM sur les acteurs distincts (parent + mots-clés regroupés)
DELETE FROM t_afom
WHERE mot_cle_id IN (
    SELECT id_mot_cle FROM t_mots_cles
    WHERE diagnostic_id IN (SELECT id_diagnostic FROM cible)
);

INSERT INTO t_afom (mot_cle_id, number)
SELECT racine.id_mot_cle,
       count(DISTINCT r.acteur_id) AS number
FROM t_mots_cles racine
JOIN t_mots_cles membre
  ON membre.id_mot_cle = racine.id_mot_cle
  OR membre.mots_cles_groupe_id = racine.id_mot_cle
JOIN cor_reponses_mots_cles c ON c.mot_cle_id = membre.id_mot_cle
JOIN t_reponses r ON r.id_reponse = c.reponse_id
WHERE racine.diagnostic_id IN (SELECT id_diagnostic FROM cible)
  AND racine.mots_cles_groupe_id IS NULL
  AND racine.is_actif IS TRUE
GROUP BY racine.id_mot_cle;

-- Relancer la section (1) SANS fermer la transaction : les diagnostics traités
-- doivent avoir disparu de la liste, ou n'y garder que l'écart des mots-clés
-- sans jumeau lié. Puis, séparément :
--   COMMIT;    -- si le résultat est conforme
--   ROLLBACK;  -- sinon
