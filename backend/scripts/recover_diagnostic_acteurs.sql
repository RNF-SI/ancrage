-- =============================================================================
-- Récupération acteurs / réponses après recopie accidentelle (diagnostic 89)
--
-- Contexte : des copies (is_copy) ont été rattachées au diagnostic alors que les
-- acteurs d'origine (acteur_origine_id) ont été détachés (diagnostic_id NULL)
-- mais conservent les réponses.
--
-- ⚠️  LIRE LES RÉSULTATS DE LA PHASE 0 AVANT D'EXÉCUTER LA PHASE 1.
-- ⚠️  Exécuter dans une transaction ; ne COMMIT qu'après vérification.
-- =============================================================================

\set diagnostic_id 89

-- -----------------------------------------------------------------------------
-- PHASE 0 — AUDIT (lecture seule)
-- -----------------------------------------------------------------------------

-- A. Acteurs actuellement liés au diagnostic (souvent les copies vides)
SELECT
    a.id_acteur,
    a.nom,
    a.prenom,
    a.is_copy,
    a.acteur_origine_id,
    a.diagnostic_id,
    COUNT(r.id_reponse) AS nb_reponses
FROM t_acteurs a
LEFT JOIN t_reponses r ON r.acteur_id = a.id_acteur
WHERE a.diagnostic_id = :diagnostic_id
  AND COALESCE(a.is_deleted, false) = false
GROUP BY a.id_acteur
ORDER BY a.id_acteur;

-- B. Acteurs d'origine à restaurer (via acteur_origine_id des copies)
SELECT
    orig.id_acteur,
    orig.nom,
    orig.prenom,
    orig.is_copy,
    orig.diagnostic_id,
    COUNT(r.id_reponse) AS nb_reponses
FROM t_acteurs copie
JOIN t_acteurs orig ON orig.id_acteur = copie.acteur_origine_id
LEFT JOIN t_reponses r ON r.acteur_id = orig.id_acteur
WHERE copie.diagnostic_id = :diagnostic_id
  AND COALESCE(copie.is_deleted, false) = false
  AND copie.acteur_origine_id IS NOT NULL
GROUP BY orig.id_acteur
ORDER BY orig.id_acteur;

-- C. Contrôles de sécurité (doivent être OK avant exécution)
-- C1. Copies sans réponses
SELECT COUNT(*) AS copies_avec_reponses
FROM t_acteurs copie
JOIN t_reponses r ON r.acteur_id = copie.id_acteur
WHERE copie.diagnostic_id = :diagnostic_id
  AND COALESCE(copie.is_copy, false) = true;

-- C2. Copies sans acteur_origine_id
SELECT COUNT(*) AS copies_sans_origine
FROM t_acteurs
WHERE diagnostic_id = :diagnostic_id
  AND COALESCE(is_copy, false) = true
  AND acteur_origine_id IS NULL;

-- C3. Origines introuvables
SELECT copie.id_acteur, copie.acteur_origine_id
FROM t_acteurs copie
LEFT JOIN t_acteurs orig ON orig.id_acteur = copie.acteur_origine_id
WHERE copie.diagnostic_id = :diagnostic_id
  AND COALESCE(copie.is_copy, false) = true
  AND copie.acteur_origine_id IS NOT NULL
  AND orig.id_acteur IS NULL;

-- C4. Total réponses sur les origines vs copies
SELECT
    SUM(CASE WHEN COALESCE(c.is_copy, false) THEN 1 ELSE 0 END) AS nb_reponses_copies,
    SUM(CASE WHEN NOT COALESCE(c.is_copy, false) OR c.is_copy IS NULL THEN 1 ELSE 0 END) AS nb_reponses_autres
FROM t_reponses r
JOIN t_acteurs a ON a.id_acteur = r.acteur_id
JOIN t_acteurs c ON c.diagnostic_id = :diagnostic_id
    AND c.acteur_origine_id = a.id_acteur
WHERE a.id_acteur IN (
    SELECT acteur_origine_id FROM t_acteurs
    WHERE diagnostic_id = :diagnostic_id AND acteur_origine_id IS NOT NULL
);

-- -----------------------------------------------------------------------------
-- PHASE 1 — RÉCUPÉRATION (transaction)
-- Attendu avant COMMIT :
--   copies_avec_reponses = 0
--   copies_sans_origine = 0
--   aucune origine introuvable
-- -----------------------------------------------------------------------------

BEGIN;

-- 1. Réattacher les acteurs d'origine au diagnostic
UPDATE t_acteurs orig
SET diagnostic_id = :diagnostic_id
WHERE orig.id_acteur IN (
    SELECT DISTINCT copie.acteur_origine_id
    FROM t_acteurs copie
    WHERE copie.diagnostic_id = :diagnostic_id
      AND copie.acteur_origine_id IS NOT NULL
      AND COALESCE(copie.is_deleted, false) = false
);

-- 2. Vérification bloquante : les copies n'ont aucune réponse
DO $$
DECLARE
    nb INT;
    diag_id INT := 89;
BEGIN
    SELECT COUNT(*) INTO nb
    FROM t_acteurs copie
    JOIN t_reponses r ON r.acteur_id = copie.id_acteur
    WHERE copie.diagnostic_id = diag_id
      AND COALESCE(copie.is_copy, false) = true;

    IF nb > 0 THEN
        RAISE EXCEPTION 'Abandon : % copie(s) ont encore des réponses', nb;
    END IF;
END $$;

-- 3. Supprimer les copies devenues inutiles (cascade sur t_reponses si vide)
DELETE FROM t_acteurs copie
WHERE copie.diagnostic_id = :diagnostic_id
  AND COALESCE(copie.is_copy, false) = true
  AND copie.acteur_origine_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM t_reponses r WHERE r.acteur_id = copie.id_acteur
  );

-- 4. Contrôle final
SELECT
    a.id_acteur,
    a.nom,
    a.prenom,
    a.is_copy,
    a.diagnostic_id,
    COUNT(r.id_reponse) AS nb_reponses
FROM t_acteurs a
LEFT JOIN t_reponses r ON r.acteur_id = a.id_acteur
WHERE a.diagnostic_id = :diagnostic_id
  AND COALESCE(a.is_deleted, false) = false
GROUP BY a.id_acteur
ORDER BY a.id_acteur;

-- Si tout est correct :
COMMIT;
-- Sinon :
-- ROLLBACK;
