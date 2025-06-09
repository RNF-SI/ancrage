1. git fetch 
2. git pull
3. Exécuter la migration en tapant flask db migrate -m "Première migration" si les modèles ont modifiés ou première migration
4. Mettre à jour la base de données en tapant flask db upgrade si les schémas ont été modifiés ou première migration
5. Importer les scripts SQL (communes, départements, régions) (si première migration) ou taper 
`UPDATE t_communes SET
  latitude = ST_Y(ST_Centroid(geom)),
  longitude = ST_X(ST_Centroid(geom));`
si vous avez déjà les localités mais pas les latitudes, longitudes des communes
6. Installer uuid : pip install Flask-UUID si non installé
7. Installer Slugify : pip install slugify si non installé
8. Copier le fichier de config Flask si première migration et à chaque changement du fichier
9. Lancer python feed_database.py (ou feed_data_test.py pour données test) 
10. Lancer python questions.py si les questions ont été modifiées
Commandes à faire la première fois :
11. Lancer le serveur flask
11. Lancer ps aux | grep flask et notez le nom d'utilisateur qui s'affiche au début de chaque ligne (ex:user)
12. Lancer sudo chown user:user /var/log/ancrage (remplacer user par votre nom d'utilisateur)
13. Lancer sudo chmod 755 /var/log/ancrage
14. Redémarrer le serveur flask
