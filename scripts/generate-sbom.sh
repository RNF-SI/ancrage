#!/usr/bin/env bash
#
# Génère les SBOM CycloneDX du projet Ancrage et, optionnellement, les envoie
# à Dependency-Track.
#
#   ./scripts/generate-sbom.sh                  # génère sbom/*.cdx.json
#   ./scripts/generate-sbom.sh --avec-dev       # inclut les dépendances npm de dev
#   ./scripts/generate-sbom.sh --envoi          # génère puis envoie à Dependency-Track
#
# Variables d'environnement pour --envoi :
#   DT_URL      URL de l'instance Dependency-Track (ex. http://localhost:8081)
#   DT_API_KEY  clé d'API avec les permissions BOM_UPLOAD, PROJECT_CREATION_UPLOAD
#               et VIEW_PORTFOLIO
#   DT_PROJET   préfixe des projets Dependency-Track (défaut : ancrage)
#   DT_VERSION  version des projets Dependency-Track (défaut : prod)
#   APP_VERSION version applicative inscrite dans les SBOM (défaut : package.json)
#
set -euo pipefail

RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SORTIE="$RACINE/sbom"
OUTILS="$RACINE/.sbom-tools"
CYCLONEDX_NPM_VERSION="6.0.1"

AVEC_DEV=0
ENVOI=0
for arg in "$@"; do
  case "$arg" in
    --avec-dev) AVEC_DEV=1 ;;
    --envoi)    ENVOI=1 ;;
    -h|--help)  sed -n '2,14p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "Option inconnue : $arg" >&2; exit 1 ;;
  esac
done

# Version du projet cote Dependency-Track : volontairement fixe (l'environnement
# déployé), et non le numéro de release. Le numéro de release reste porté par le
# composant racine du SBOM.
PROJET="${DT_PROJET:-ancrage}"
VERSION="${DT_VERSION:-prod}"

# Version applicative réelle, portée par le composant racine des SBOM. En CI on y
# passe le tag de la release ; sinon on retombe sur celle du package.json.
VERSION_APP="${APP_VERSION:-$(node -p "require('$RACINE/frontend/package.json').version")}"
mkdir -p "$SORTIE"

# --- Backend (Python) ---------------------------------------------------------
# On lit requirements.txt et non le venv : les versions y sont toutes épinglées,
# et le venv du dépôt n'est pas toujours utilisable (version de Python système).
if [ ! -x "$OUTILS/bin/cyclonedx-py" ]; then
  echo "» Installation de cyclonedx-bom dans $OUTILS"
  python3 -m venv "$OUTILS"
  "$OUTILS/bin/pip" install --quiet --upgrade pip cyclonedx-bom
fi

echo "» SBOM backend"
"$OUTILS/bin/cyclonedx-py" requirements \
  --sv 1.6 \
  --of JSON \
  --mc-type application \
  -o "$SORTIE/backend.cdx.json" \
  "$RACINE/backend/requirements.txt"

# `cyclonedx-py requirements` ne déduit aucun composant racine (il n'y a pas de
# pyproject.toml côté backend) : on l'ajoute, sinon le graphe de dépendances
# arrive incomplet dans Dependency-Track.
"$OUTILS/bin/python" - "$SORTIE/backend.cdx.json" "$VERSION_APP" "$PROJET-backend" <<'PY'
import json, sys

chemin, version, nom = sys.argv[1], sys.argv[2], sys.argv[3]
with open(chemin) as f:
    bom = json.load(f)

racine = {
    "type": "application",
    "bom-ref": f"{nom}@{version}",
    "name": nom,
    "version": version,
}
bom["metadata"]["component"] = racine
bom.setdefault("dependencies", []).insert(0, {
    "ref": racine["bom-ref"],
    "dependsOn": sorted(c["bom-ref"] for c in bom.get("components", [])),
})

with open(chemin, "w") as f:
    json.dump(bom, f, indent=2, sort_keys=True)
PY

# --- Frontend (npm) -----------------------------------------------------------
echo "» SBOM frontend"
OPTIONS_NPM=(--spec-version 1.6 --output-format JSON)
if [ "$AVEC_DEV" -eq 0 ]; then
  OPTIONS_NPM+=(--omit dev)
fi

(cd "$RACINE/frontend" && npx --yes "@cyclonedx/cyclonedx-npm@$CYCLONEDX_NPM_VERSION" \
  "${OPTIONS_NPM[@]}" --output-file "$SORTIE/frontend.cdx.json")

echo
for f in "$SORTIE"/*.cdx.json; do
  echo "  $f — $(node -p "require('$f').components.length") composants"
done

# --- Envoi vers Dependency-Track ---------------------------------------------
if [ "$ENVOI" -eq 0 ]; then
  exit 0
fi

: "${DT_URL:?DT_URL n'est pas défini}"
: "${DT_API_KEY:?DT_API_KEY n'est pas défini}"

# DT_URL doit viser l'API server et non l'interface web : les deux sont des services
# distincts, et le frontend répond 405 à tout POST/PUT.
# (le frontend sert index.html en repli sur /api/version, et ce HTML contient lui
# aussi le mot « Dependency-Track » : on teste donc le champ JSON exact)
if ! curl -sS -f -m 10 "$DT_URL/api/version" | grep -q '"application":"Dependency-Track"'; then
  echo "DT_URL ne pointe pas vers l'API server de Dependency-Track : $DT_URL" >&2
  echo "Vérifier avec : curl -sS \$DT_URL/api/version (doit renvoyer du JSON)" >&2
  exit 1
fi

envoyer() {
  local nom="$1" fichier="$2"
  echo "» Envoi de $nom"
  curl -sS -f \
    -X POST "$DT_URL/api/v1/bom" \
    -H "X-Api-Key: $DT_API_KEY" \
    -F "projectName=$nom" \
    -F "projectVersion=$VERSION" \
    -F "autoCreate=true" \
    -F "bom=@$fichier"
  echo
}

envoyer "$PROJET-backend"  "$SORTIE/backend.cdx.json"
envoyer "$PROJET-frontend" "$SORTIE/frontend.cdx.json"

echo "Terminé — voir $DT_URL"
