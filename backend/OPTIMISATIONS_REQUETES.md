# Rapport d'Optimisation des Requêtes Backend

## 🔴 Problèmes Critiques Identifiés

### 1. Problèmes N+1 (Très Impactant)

#### 1.1 `getAllSites()` - `/sites` (sites.py:81)
**Problème** : Charge tous les sites sans eager loading des relations
```python
sites = Site.query.filter_by().all()  # ❌ Pas d'eager loading
```
**Impact** : Pour chaque site, le schéma accède à `diagnostics`, `departements`, `type` → N+1 queries

**Solution** :
```python
from sqlalchemy.orm import joinedload, selectinload

sites = (
    Site.query
    .options(
        selectinload(Site.diagnostics),
        selectinload(Site.departements).selectinload(Departement.region),
        joinedload(Site.type)
    )
    .all()
)
```

#### 1.2 `getSite()` - Utilisation du schéma (sites.py:125)
**Problème** : Le schéma accède aux relations sans eager loading préalable
**Solution** : Ajouter eager loading avant l'appel au schéma :
```python
def getSite(site):
    # Recharger avec eager loading si nécessaire
    site = (
        db.session.query(Site)
        .options(
            selectinload(Site.diagnostics),
            selectinload(Site.departements).selectinload(Departement.region),
            joinedload(Site.type)
        )
        .filter_by(id_site=site.id_site)
        .first()
    )
    schema = SiteSchema(many=False)
    siteObj = schema.dump(site)
    return jsonify(siteObj)
```

#### 1.3 `getAllActeursBySites()` - `/acteurs/sites` (acteurs.py:130)
**Problème** : Charge les acteurs sans eager loading des relations
```python
acteurs = Acteur.query.filter(Acteur.diagnostic_id.in_(ids_diagnostics)).filter_by(is_deleted=False).all()
```
**Impact** : Pour chaque acteur, accès à `commune`, `categories`, `reponses`, `diagnostic` → N+1 queries

**Solution** :
```python
acteurs = (
    Acteur.query
    .filter(Acteur.diagnostic_id.in_(ids_diagnostics))
    .filter_by(is_deleted=False)
    .options(
        joinedload(Acteur.commune).joinedload(Commune.departement),
        selectinload(Acteur.categories),
        selectinload(Acteur.reponses).joinedload(Reponse.valeur_reponse),
        selectinload(Acteur.reponses).joinedload(Reponse.question),
        joinedload(Acteur.diagnostic)
    )
    .all()
)
```

#### 1.4 `getDiagnostic()` - Utilisation du schéma (diagnostics.py:871)
**Problème** : Le schéma accède à `acteurs`, `sites`, `documents` sans eager loading
**Solution** :
```python
def getDiagnostic(diagnostic):
    # Recharger avec eager loading
    diagnostic = (
        db.session.query(Diagnostic)
        .options(
            selectinload(Diagnostic.acteurs).joinedload(Acteur.commune),
            selectinload(Diagnostic.acteurs).selectinload(Acteur.categories),
            selectinload(Diagnostic.sites).selectinload(Site.departements),
            selectinload(Diagnostic.documents)
        )
        .filter_by(id_diagnostic=diagnostic.id_diagnostic)
        .first()
    )
    schema = DiagnosticSchema(many=False)
    diagnosticObj = schema.dump(diagnostic)
    return jsonify(diagnosticObj)
```

#### 1.5 `verifDatesEntretien()` - (reponses.py:223)
**Problème** : Accède à `diagnostic.acteurs` sans eager loading
```python
diagnostic = Diagnostic.query.filter_by(id_diagnostic=diagnostic_id).first()
# Puis accès à diagnostic.acteurs → requête supplémentaire
```
**Solution** :
```python
diagnostic = (
    Diagnostic.query
    .options(selectinload(Diagnostic.acteurs).joinedload(Acteur.statut_entretien))
    .filter_by(id_diagnostic=diagnostic_id)
    .first()
)
```

#### 1.6 `checkCCG()` - (functions.py:3)
**Problème** : Charge l'acteur et accède aux catégories sans eager loading
```python
acteur = Acteur.query.filter_by(id_acteur=id_acteur).first()
# Puis boucle sur acteur.categories → requête supplémentaire
```
**Solution** :
```python
acteur = (
    Acteur.query
    .options(selectinload(Acteur.categories))
    .filter_by(id_acteur=id_acteur)
    .first()
)
```

### 2. Requêtes Redondantes

#### 2.1 `enregistrer_reponse()` - (reponses.py:79-82)
**Problème** : Requête inutile après `returning()` qui retourne déjà le résultat
```python
db.session.execute(stmt)  # stmt contient .returning(Reponse)
db.session.commit()

result = db.session.query(Reponse).filter_by(...).first()  # ❌ Redondant
```
**Solution** : Utiliser le résultat de `returning()` :
```python
result = db.session.execute(stmt).scalar_one()
db.session.commit()
```

#### 2.2 `disableDiagnostic()` - (diagnostics.py:76)
**Problème** : Requête redondante après mise à jour
```python
diagnostic.is_disabled = True
db.session.add(diagnostic)
db.session.commit()
diagnostic = Diagnostic.query.filter_by(id_diagnostic=id_diagnostic).first()  # ❌ Redondant
```
**Solution** : Utiliser l'objet déjà en mémoire :
```python
diagnostic.is_disabled = True
db.session.commit()
# diagnostic est déjà en mémoire, pas besoin de recharger
return getDiagnostic(diagnostic)
```

#### 2.3 `disableActeur()` - (acteurs.py:170)
**Même problème** que ci-dessus

### 3. Requêtes dans des Boucles (Très Impactant)

#### 3.1 `changeValuesSite()` - (sites.py:120)
**Problème** : Requête dans une boucle pour chaque département
```python
for dept_id in new_dept_ids - current_depts:
    join = Departement.query.filter_by(id_departement=dept_id).first()  # ❌ Dans boucle
    site.departements.append(join)
```
**Solution** : Charger tous les départements en une seule requête
```python
dept_ids_list = list(new_dept_ids - current_depts)
if dept_ids_list:
    depts = Departement.query.filter(Departement.id_departement.in_(dept_ids_list)).all()
    site.departements.extend(depts)
```

#### 3.2 `changeValuesActeur()` - (acteurs.py:200)
**Problème** : Requête dans une boucle pour chaque catégorie
```python
for cat_id in new_cat_ids - current_cats:
    join = Nomenclature.query.filter_by(id_nomenclature=cat_id).first()  # ❌ Dans boucle
    acteur.categories.append(join)
```
**Solution** :
```python
cat_ids_list = list(new_cat_ids - current_cats)
if cat_ids_list:
    cats = Nomenclature.query.filter(Nomenclature.id_nomenclature.in_(cat_ids_list)).all()
    acteur.categories.extend(cats)
```

#### 3.3 `changeValuesDiagnostic()` - (diagnostics.py:519)
**Problème** : Requête dans une boucle pour chaque site
```python
for site_id in new_site_ids - current_site_ids:
    site = Site.query.filter_by(id_site=site_id).first()  # ❌ Dans boucle
    if site:
        diagnostic.sites.append(site)
```
**Solution** :
```python
site_ids_list = list(new_site_ids - current_site_ids)
if site_ids_list:
    sites = Site.query.filter(Site.id_site.in_(site_ids_list)).all()
    diagnostic.sites.extend(sites)
```

### 4. Requêtes Non Optimisées

#### 4.1 `getAllDiagnostics()` - (diagnostics.py:108)
**Problème** : Charge tous les diagnostics sans pagination ni eager loading
**Solution** : Ajouter pagination et eager loading :
```python
page = request.args.get('page', 1, type=int)
per_page = request.args.get('per_page', 50, type=int)

diagnostics = (
    Diagnostic.query
    .options(
        selectinload(Diagnostic.sites),
        selectinload(Diagnostic.acteurs)
    )
    .paginate(page=page, per_page=per_page, error_out=False)
)
```

#### 4.2 `verifCompleteStatus()` - (reponses.py:275)
**Problème** : Plusieurs requêtes séparées qui pourraient être combinées
**Solution** : Utiliser une seule requête avec sous-requête :
```python
from sqlalchemy import case

# Requête optimisée combinant les deux comptages
result = (
    db.session.query(
        func.count(Reponse.id_reponse).label('nb_reponses'),
        func.count(Question.id_question).label('nb_questions'),
        case(
            (func.bool_or(Nomenclature.libelle == "Membres ou participants au CCG"), True),
            else_=False
        ).label('is_ccg')
    )
    .select_from(Reponse)
    .join(Acteur, Reponse.acteur_id == Acteur.id_acteur)
    .outerjoin(acteur_categorie, Acteur.id_acteur == acteur_categorie.c.acteur_id)
    .outerjoin(Nomenclature, Nomenclature.id_nomenclature == acteur_categorie.c.categorie_id)
    .join(Question, Reponse.question_id == Question.id_question)
    .outerjoin(Nomenclature, Question.theme_id == Nomenclature.id_nomenclature)
    .filter(Reponse.acteur_id == id_acteur)
    .first()
)
```

### 5. Requêtes Complexes - Optimisations Possibles

#### 5.1 Routes de graphiques (diagnostics.py:137-499)
**Problème** : Requêtes avec beaucoup de jointures, mais bien structurées
**Recommandation** : Ajouter des index sur les colonnes fréquemment filtrées :
- `Acteur.is_deleted`
- `Question.indications`
- `Diagnostic.id_diagnostic`
- `Reponse.acteur_id`, `Reponse.question_id`

## 📊 Impact Estimé

| Problème | Impact | Priorité |
|----------|--------|----------|
| N+1 dans `getAllSites()` | 🔴 Très élevé | 1 |
| N+1 dans `getAllActeursBySites()` | 🔴 Très élevé | 1 |
| Requêtes dans boucles | 🔴 Très élevé | 1 |
| N+1 dans `getDiagnostic()` | 🟠 Élevé | 2 |
| Requêtes redondantes | 🟡 Moyen | 3 |
| Absence de pagination | 🟡 Moyen | 3 |

## ✅ Actions Recommandées

1. **Immédiat** : Corriger les problèmes N+1 dans les routes les plus utilisées
2. **Court terme** : Éliminer toutes les requêtes dans les boucles
3. **Moyen terme** : Ajouter la pagination sur les listes
4. **Long terme** : Ajouter des index sur les colonnes fréquemment filtrées

## 🔧 Outils de Diagnostic

Pour identifier les problèmes N+1 en production :
```python
# Ajouter dans config.py
SQLALCHEMY_ECHO = True  # Affiche toutes les requêtes SQL
```

Ou utiliser SQLAlchemy events pour logger les requêtes :
```python
from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(Engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    logger.debug(f"SQL: {statement}")
```

