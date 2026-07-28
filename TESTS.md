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
