---
description: Traite un lot d'issues ancrage « mêmes fichiers » en séquentiel dans une seule session (un commit par issue)
argument-hint: <numéros d'issues du lot, ex: "103 107 105">
allowed-tools: Bash(gh:*), Bash(git:*), Bash(python:*), Bash(python3:*), Bash(npm:*), Bash(npx:*), Bash(curl:*), Edit, Read, Write, AskUserQuestion
---

Lot à traiter : #$ARGUMENTS

Ces issues ont été regroupées parce qu'elles touchent les MÊMES fichiers. On les
traite en SÉQUENTIEL dans une seule session pour charger le contexte une fois,
mais chaque issue garde son propre commit et sa propre trace.

Contexte préchargé (tout le lot) :
!`for n in $ARGUMENTS; do echo "===== #$n ====="; gh issue view $n --json title,body,labels,comments --jq '"TITRE: \(.title)\nLABELS: \([.labels[].name]|join(", "))\nBODY:\n\(.body)\nCOMMENTAIRES: \(.comments|length)\n\(.comments|map("  ↳ \(.author.login): \(.body)")|join("\n"))"'; echo; done`

Procédure :

1. PRÉPARE la session, une seule fois :
   - `git checkout main && git pull` (on travaille directement sur `main`).
     Le dépôt avance à plusieurs : si le pull ramène des commits, relis les
     fichiers visés avant d'éditer.
   - Télécharge et OUVRE les captures de chaque issue (`curl -sL "<url>" -o …`
     puis Read). Beaucoup de ces retours ne se comprennent que sur l'image.
   - Identifie les fichiers communs du lot et lis-les MAINTENANT (contexte partagé).

2. CLASSE chaque issue du lot dans un bac :
   - A = assertion vérifiable (valeur calculée, réponse API, libellé de
     `utils/labels.ts`, contenu d'export, route, requête SQL).
   - B = visuel/perceptuel, à valider à l'œil (Chart.js, légendes, couleurs, mise en page).
   - C = ambigu, trop large, ou décision produit non tranchée.
   Pour chaque issue, prends en compte le DERNIER commentaire de retour de test
   s'il existe : c'est lui qui définit le travail à faire maintenant.

3. ÉTABLIS l'ordre de traitement à l'intérieur du lot :
   - Range les issues pour que les corrections ne se marchent pas dessus (ex : une
     correction du calcul des scores AVANT un ajustement d'affichage du même graphique).
   - Signale les dépendances (« 107 doit passer avant 103 parce que… »).
   - Sors les issues bac C du flux : NE les corrige pas.

4. Pour CHAQUE issue A/B, dans l'ordre, en boucle :
   a. Si non trivial, annonce en une ligne le plan (fichiers + approche) avant de coder.
   b. Applique la correction. Respecte le CLAUDE.md : composants standalone,
      `inject()`, signals, `effect()`, `@if`/`@for`, trio `copy()`/`fromJson()`/
      `toJson()` + interface pour tout modèle touché, libellés dans
      `utils/labels.ts`, `@check_auth(1)` sur toute route backend, ajout du module
      dans la liste d'imports de `routes/__init__.py`. Code et libellés en français.
   c. Tests, périmètre concerné UNIQUEMENT :
      - Backend : `cd backend && python -m pytest tests/<fichier> -q`
        (si A et backend → écris/maj le test d'abord).
      - Frontend : `cd frontend && npx ng test --include='**/<spec>.spec.ts' --watch=false --browsers=ChromeHeadless`
        (si A et frontend → écris/maj le test d'abord).
      - Si B → pas de test auto ; ajoute dans `TESTS.md` :
        `- [ ] #<n> — <titre> — étapes de validation manuelle`.
      - Les tests pytest exigent le venv backend et `backend/config.py` (gitignoré)
        et tapent une vraie base. S'ils ne peuvent pas tourner, DIS-LE au lieu de
        laisser croire qu'ils passent.
   d. Commit ATOMIQUE, un par issue, message en français :
      `<résumé court> (#<n>)`. Ne regroupe JAMAIS plusieurs issues dans un commit.
   e. OBLIGATOIRE — ne passe PAS à l'issue suivante sans ces deux actions, et
      vérifie qu'elles ont abouti :
      - commente le résumé sur l'issue : `gh issue comment <n> --body "..."` ;
      - pose le label `à tester` :
        `gh label create "à tester" --color FBCA04 --description "Correction à valider" 2>/dev/null; gh issue edit <n> --add-label "à tester"`.
      Si une des deux échoue, corrige et relance avant de continuer.
   f. Ne FERME JAMAIS l'issue — c'est le mainteneur qui valide et ferme.

5. Pour CHAQUE issue bac C : ne corrige pas. POSE-MOI d'abord tes questions
   directement dans le terminal (outil AskUserQuestion) au lieu de trancher seul
   ou de commenter l'issue sans me consulter.
   - Si mes réponses lèvent l'ambiguïté → reclasse en A/B et traite-la dans le
     flux (étape 4).
   - Si l'ambiguïté persiste (vraie décision produit) → alors SEULEMENT commente
     tes questions précises (`gh issue comment <n>`), pose le label `à discuter`
     (`gh label create "à discuter" --color D876E3 2>/dev/null; gh issue edit <n> --add-label "à discuter"`),
     et passe à la suivante.

6. À la fin du lot, lance une passe de tests groupée sur les fichiers communs
   touchés (un seul `pytest` / `ng test` sur l'ensemble) pour vérifier qu'aucune
   correction n'en a cassé une autre du même lot.

6bis. Si le lot a touché un modèle SQLAlchemy ou le questionnaire, rappelle-le
      dans le récap : `backend/migrations/` est gitignoré (migration à régénérer
      dans chaque environnement) et `questions.py` ne met pas à jour les bases
      existantes.

7. Termine par un RÉCAP du lot sous forme de tableau :
   | Issue | Bac | Fichiers | Commit | Test auto | Commenté (oui/non) | Statut (fait / discussion / manuel) |
   La colonne « Commenté » doit être `oui` pour toute issue A/B traitée (étape 4e) :
   une case `non` signale un travail non terminé. Puis liste les points de
   validation manuelle (bac B) et les questions posées (bac C), et ARRÊTE pour que
   je fasse le point avant le lot suivant.
