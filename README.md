# Déploiement Debian 13 (Trixie) - Python 3.13

## Python 3.13 : prod vs local

| Environnement | Python disponible | Commande |
|---|---|---|
| **Debian 13 Trixie** (serveur prod) | `python3.13` dans les dépôts officiels | voir section 1 ci-dessous |
| **Ubuntu 24.04 / Debian 12** (dev local) | Python 3.12 par défaut, pas de `python3.13` dans apt | voir section « Dev local Ubuntu » |

Sur Ubuntu 24.04, `apt install python3.13` échoue normalement : ce paquet n'existe pas dans les dépôts Ubuntu.

## Dev local Ubuntu (24.04) ou Debian 12

Installer Python 3.13 via le PPA [deadsnakes](https://launchpad.net/~deadsnakes/+archive/ubuntu/ppa) :

```bash
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
sudo apt install -y python3.13 python3.13-venv python3.13-dev \
  build-essential libpq-dev libgeos-dev libproj-dev
```

Puis recréer le venv :

```bash
cd backend
rm -rf .venv   # ou venv, selon le nom de votre dossier
python3.13 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

> Alternative : continuer en local avec Python 3.12 (`python3.12 -m venv .venv`) le temps de préparer le serveur Trixie. Les dépendances du projet restent compatibles.

## 1) Prérequis système (Debian 13 Trixie)

```bash
sudo apt update
sudo apt install -y \
  python3.13 python3.13-venv python3.13-dev \
  build-essential libpq-dev \
  postgresql postgresql-contrib \
  libgeos-dev libproj-dev gdal-bin \
  git
```

> Les dépendances Python du projet sont mises à jour pour Python 3.13.

## 2) Récupération du code

```bash
git fetch
git pull
```

## 3) Environnement Python backend

```bash
cd backend
python3.13 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

## 4) Configuration applicative

- Copier le fichier de configuration Flask (si première installation ou si modifié).
- Vérifier les variables d'environnement (DB, secrets, mail, etc.).

## 5) Migrations base de données

Si les modèles ont changé (ou première installation) :

```bash
flask db migrate -m "Premiere migration"
flask db upgrade
```

Puis importer les scripts SQL (communes, départements, régions) si nécessaire.

Si les communes existent déjà mais sans latitude/longitude :

```sql
UPDATE t_communes SET
  latitude = ST_Y(ST_Centroid(geom)),
  longitude = ST_X(ST_Centroid(geom));
```

## 6) Initialisation des données métier

```bash
python feed_database.py
# ou feed_data_test.py pour les données de test
python questions.py
```

## 7) Répertoire de logs

```bash
sudo mkdir -p /var/log/ancrage
sudo chown "$USER":"$USER" /var/log/ancrage
sudo chmod 755 /var/log/ancrage
```

## 8) Lancement du backend

```bash
python run.py
```

En production, privilégier `gunicorn` derrière un reverse proxy (nginx/apache).
