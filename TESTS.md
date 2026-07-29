# Points de validation manuelle

Corrections livrées sans test automatisé (les tests pytest exigent le venv backend
et `backend/config.py`, gitignorés ; `ng test` exige `frontend/node_modules`).

- [ ] #100 — Non-correspondance score graphiques / données entretiens — sur un diagnostic
      réel, prendre une question dont un acteur a été enregistré en « Réponse avec
      commentaire » (commentaire saisi sans note) : vérifier que cet acteur ne compte plus
      dans la médiane des barres ni dans le radar, et que le camembert « Répartition des
      réponses » n'affiche plus ni « Réponse avec commentaire » ni « N'a pas exprimé de
      réponse claire ». Vérifier ensuite que la personnalisation avec le curseur
      « Afficher N'a pas exprimé de réponse claire » activé les fait bien réapparaître, et
      que les chiffres par défaut correspondent désormais à ceux de la personnalisation
      curseur éteint.
- [ ] #102 — Graphiques de synthèse — sur le cas signalé (« Connaissance du gestionnaire »
      notée « Complet » par tous les acteurs) : vérifier que le radar global
      « Connaissances » affiche bien 5 pour tous les groupes, comme les barres. Vérifier
      que le radar est titré « Score médian ». Vérifier enfin qu'une question sans aucune
      réponse notée pour un groupe ne trace plus un point à 0 sur le radar mais interrompt
      la ligne de ce groupe.
- [ ] #99 — Couleur « N'a pas exprimé de réponse claire » — dans l'onglet de
      personnalisation, activer le curseur « Afficher la réponse "N'a pas exprimé de
      réponse claire" » sur une question où cette réponse a été saisie en même temps
      qu'une vraie note de 3 (par exemple « Connaissance de la règlementation », dont les
      notes possibles sont 1, 3 et 5). Vérifier que la part « N'a pas exprimé de réponse
      claire » est grise et la part de score 3 jaune, donc distinguables dans le camembert
      et dans l'export PNG.
- [ ] #106 — Longueur des titres — sur une question au libellé long (celle de la capture de
      l'issue), vérifier que le titre s'affiche en entier au-dessus du graphique, réparti
      sur plusieurs lignes si nécessaire, et qu'il n'est plus rogné. Vérifier qu'il est
      désormais dessiné dans le graphique lui-même et non au-dessus en HTML.
- [ ] #101 — Légendes trop longues — sur la question « nature des liens », dont les réponses
      dépassent 40 caractères, vérifier que la légende du camembert ne sort plus du cadre :
      les libellés sont raccourcis par des points de suspension et la légende est passée
      sous le graphique. Vérifier qu'au survol d'une part, l'infobulle affiche bien le
      libellé complet, non tronqué.
- [ ] #87 — Export des graphiques — exporter en PNG un graphique de score, un camembert et
      un radar. Vérifier que chaque image contient son titre (question, « Répartition des
      réponses — … », thème) et qu'elle a un fond blanc et non transparent une fois
      insérée dans un document. Vérifier que l'export des graphiques personnalisés, qui
      demande un titre par une boîte de dialogue, fonctionne toujours et produit lui aussi
      un fond blanc.
- [ ] #104 — Extraction des données — sur un diagnostic contenant des entretiens terminés,
      utiliser « Exporter la matrice (XLS anonymisé) ». Vérifier que le tableur contient
      bien les scores et non des « NULL » partout, que les colonnes vont jusqu'aux
      dernières questions du questionnaire (« Sentiment d'implication », « Impacts »,
      « Adaptation », « Avis », « Attentes »), soit 34 colonnes de questions et non 25,
      et qu'une question non répondue laisse une cellule vide. Vérifier que les en-têtes
      sont lisibles sans élargir les colonnes à la main. Relancer l'export deux fois de
      suite et vérifier que « acteur1 » désigne le même individu. Refaire la même
      vérification sur « Exporter toutes les réponses (XLS) ».
