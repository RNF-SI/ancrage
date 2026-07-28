---
description: Traite une issue GitHub ancrage de bout en bout (classe, corrige, teste, commente)
argument-hint: <numéro d'issue>
allowed-tools: Bash(gh:*), Bash(git:*), Bash(python:*), Bash(python3:*), Bash(npm:*), Bash(npx:*), Bash(curl:*), Edit, Read, Write, AskUserQuestion
---

Issue à traiter : #$ARGUMENTS

Contexte préchargé :
!`gh issue view $ARGUMENTS --json title,body,labels,comments`

Procédure :

1. CLASSE l'issue dans un bac :
   - A = comportement avec assertion vérifiable (valeur calculée, forme d'une
     réponse API, libellé dans `utils/labels.ts`, contenu d'un export, route,
     requête SQL, statut d'entretien).
   - B = visuel / perceptuel, à valider à l'œil (rendu Chart.js, débordement de
     légende, couleur, mise en page Material/Bootstrap).
   - C = ambigu, trop large, ou décision produit non tranchée.

1bis. REGARDE LES CAPTURES. La plupart des issues ancrage sont illustrées et
      le texte seul ne suffit pas. Extrais les URLs d'images du corps et des
      commentaires, télécharge-les dans le scratchpad puis ouvre-les avec Read :
      `curl -sL "<url>" -o /tmp/issue-$ARGUMENTS-1.png`

1ter. IDENTIFIE le dernier commentaire de retour de test (le plus récent, du
      mainteneur). C'est LUI qui définit le travail à faire MAINTENANT.
      L'historique sert de contexte (ce qui a déjà été tenté), pas de cahier des
      charges. Si le dernier commentaire contredit un ancien « ↳ Fait », c'est le
      dernier qui gagne : la correction précédente est incomplète ou a régressé.

2. Si C → NE corrige PAS tout de suite. POSE-MOI d'abord tes questions
   directement dans le terminal (outil AskUserQuestion) au lieu de trancher seul
   ou de commenter l'issue sans me consulter.
   - Si mes réponses lèvent l'ambiguïté → reclasse l'issue en A/B et reprends à
     l'étape 3.
   - Si l'ambiguïté persiste (vraie décision produit, hors de ta portée) → alors
     SEULEMENT commente tes questions précises sur l'issue
     (`gh issue comment $ARGUMENTS --body "..."`), pose le label `à discuter`,
     puis ARRÊTE.

3. Travaille directement sur `main`. Mets-toi à jour avant de commencer :
   `git checkout main && git pull`. Le dépôt avance vite et à plusieurs — si
   `git pull` ramène des commits, relis les fichiers que tu comptes modifier
   AVANT d'éditer.

4. Si la correction n'est pas triviale, expose d'abord un plan court
   (fichiers visés + approche) avant de coder. Respecte le CLAUDE.md :
   composants standalone, `inject()`, signals, `effect()` plutôt que `ngOnInit`,
   `@if`/`@for`, trio `copy()`/`fromJson()`/`toJson()` + interface pour tout
   modèle touché, libellés dans `utils/labels.ts`, `@check_auth(1)` sur toute
   route backend, ajout du module dans la liste d'imports de `routes/__init__.py`.
   Code et libellés en français.

5. Applique la correction.

6. Tests, en ne lançant QUE le périmètre concerné :
   - Backend : `cd backend && python -m pytest tests/<fichier> -q`
     (si A et backend → écris/maj le test d'abord).
   - Frontend : `cd frontend && npx ng test --include='**/<spec>.spec.ts' --watch=false --browsers=ChromeHeadless`
     (si A et frontend → écris/maj le test d'abord).
   - Si B → pas de test auto ; ajoute dans `TESTS.md` :
     `- [ ] #$ARGUMENTS — <titre> — étapes de validation manuelle`.
   - Le venv backend et `backend/config.py` (gitignoré) sont indispensables aux
     tests pytest, qui tapent une vraie base. S'ils manquent, NE PRÉTENDS PAS que
     les tests passent : dis-le explicitement et propose la vérification à faire.

6bis. Si la correction touche un modèle SQLAlchemy, rappelle dans ton récap que
      `backend/migrations/` est gitignoré : la migration est locale à chaque
      environnement et devra être régénérée (`flask db migrate` / `flask db upgrade`).
      Si elle touche le questionnaire, signale que `questions.py` ne suffit pas :
      les bases existantes doivent être mises à jour séparément.

7. Commit atomique, message en français comme le reste de l'historique :
   `<résumé court> (#$ARGUMENTS)` — un seul commit pour cette issue.

8. OBLIGATOIRE — ne conclus JAMAIS sans ces deux actions, et vérifie qu'elles
   ont bien réussi avant de passer à l'étape 9 :
   a. Commente le résumé de la correction sur l'issue :
      `gh issue comment $ARGUMENTS --body "..."`
   b. Pose le label `à tester` :
      `gh label create "à tester" --color FBCA04 --description "Correction à valider" 2>/dev/null; gh issue edit $ARGUMENTS --add-label "à tester"`
   Si l'une des deux commandes échoue, corrige et relance — ne termine pas tant
   qu'elles n'ont pas abouti.

9. Ne FERME JAMAIS l'issue — c'est moi qui valide et ferme.

10. Termine par un récap compact : bac (A/B/C), fichiers touchés, test auto
    oui/non (et s'il n'a pas pu tourner, pourquoi), étapes manuelles s'il y en a,
    et confirme explicitement que le commentaire de l'étape 8 a bien été posté
    (l'omettre = travail non fini).
