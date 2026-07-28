# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ancrage is a territorial diagnostic ("ancrage territorial") application: a Flask/Python REST API backend (`/backend`) and an Angular 19 SPA frontend (`/frontend`). It analyzes territorial anchoring through diagnostics, interviews (entretiens), site visits, actors (acteurs), questionnaires, and data visualization (maps + charts). It is part of the RNF (Réserves Naturelles de France) ecosystem and reuses GeoNature's `pypnusershub` for authentication. **UI, code identifiers, comments and DB labels are in French** — keep new code in French to match.

`backend/docs/documentation_technique.md` is the authoritative in-repo technical doc (in French), with worked code examples for the frontend model contract. Read it before large frontend refactors.

## Technology Stack

- **Backend**: Flask 3.1.1, SQLAlchemy 1.4 + Flask-SQLAlchemy, PostgreSQL/PostGIS via GeoAlchemy2 + Shapely, Marshmallow schemas, Flask-Migrate/Alembic, Flask-Mail, pandas/openpyxl (Excel I/O). Python 3.13.
- **Auth**: `pypnusershub` (GeoNature usershub) with the `LocalProvider`. This is NOT plain Flask-Login/Authlib — auth and register routes come from `pypnusershub`. The frontend sends `Authorization: Bearer <token>`; the token lives in `localStorage` under `tk_id_token`.
- **Frontend**: Angular 19 (standalone components, signals), Angular Material + Bootstrap 5.3, Leaflet (+ markercluster/supercluster) for maps, Chart.js 3 + ng2-charts for charts, xlsx + file-saver + html2canvas (exports), ngx-toastr, ngx-matomo, ng-recaptcha-2, Moment.js (`fr-FR` locale). Node 22 (`.nvmrc`).

## Required Local Setup (files not in the repo)

These are gitignored/untracked and the app will not build or start without them:

- **`backend/config.py`** — defines the `Config` object (`SQLALCHEMY_DATABASE_URI`, `DOMAIN_FRONT`, secrets, mail).
- **`frontend/src/environments/environment.ts`** — holds `flask_server` (API base URL), imported by every service. `angular.json` swaps in `environment.prod.ts` for the production build.
- **Git submodule** `frontend/src/app/home-rnf` (from `RNF-SI/home-rnf`) — the frontend build fails without it:
  ```bash
  git submodule update --init --recursive
  ```
- **Log directory**: `sudo mkdir -p /var/log/ancrage && sudo chown $USER:$USER /var/log/ancrage`
- **First DB setup**: import the SQL for communes/départements/régions, then if latitude/longitude are empty:
  `UPDATE t_communes SET latitude=ST_Y(ST_Centroid(geom)), longitude=ST_X(ST_Centroid(geom));`

See `README.md` for full Debian 13 / Python 3.13 deployment (deadsnakes PPA on Ubuntu, system libs `libpq-dev libgeos-dev libproj-dev gdal-bin`).

## Development Commands

### Frontend (`cd frontend`)
```bash
npm install
npm start          # ng serve (dev server)
npm run build      # production build — NODE_OPTIONS max-old-space-size=4096 is required, the build is memory-heavy
npm run watch      # dev build with --watch
npm test           # Karma + Jasmine
ng test --include='**/foo.spec.ts'   # single spec
```
Only a handful of `.spec.ts` files exist; most components are untested.

### Backend (`cd backend`, venv with Python 3.13 active)
```bash
pip install -r requirements.txt
flask db migrate -m "message"   # only after model changes
flask db upgrade                # apply migrations
python feed_database.py         # load initial business data (feed_data.py also exists)
python questions.py             # (re)load questionnaire definitions
python run.py                   # dev server (debug=True). Production: gunicorn behind nginx/apache
```

### Backend Tests (pytest)
```bash
python tests/run_tests.py                          # full suite + coverage (models/routes/schemas)
python -m pytest tests/test_routes_complete.py -v   # one file
python -m pytest tests/test_routes_complete.py::test_name -v   # one test
```
`tests/conftest.py` builds the app via `create_app()` and **mocks `pypnusershub`'s `AuthManager.init_app`** so tests run without the auth backend. It keeps the real `SQLALCHEMY_DATABASE_URI` from `config.py` (despite the "base en mémoire" comment), so a reachable database is still required. Fixtures: `app`, `client`, `runner`.

## Backend Architecture

- **App factory** (`app/__init__.py` `create_app()`): the ordering matters and is fragile. It wires config → mail → Migrate → CORS → `db.init_app`, then **injects `db` into `pypnusershub.db`, `pypnusershub.db.models`, `pypnusershub.auth` and `pypnusershub.login_manager` before** initializing `login_manager` / `auth_manager` with the `LocalProvider`, then registers the pypnusershub auth + register blueprints, then the app blueprint. Reordering these steps breaks auth.
- **Single blueprint**: `routes/__init__.py` defines `bp = Blueprint('main', __name__)` and imports every route module at the bottom. **Adding a route file means adding it to that import list**, or the routes are silently never registered.
- **Route auth**: routes are protected with `@check_auth(1)` from `pypnusershub.decorators`, placed under `@bp.route(...)`. Follow this on new endpoints — note a few existing routes lack it.
- **Shared query helpers** live in `routes/functions.py` (e.g. `checkCCG`, `required_questions_query`), not in the route modules. Put cross-route business logic there.
- **Models**: all SQLAlchemy models in the single file `models/models.py` (~250 lines). Business tables are prefixed `t_`, association tables `cor_*`. Geographic models use GeoAlchemy2 geometry columns (`Site.geom` MULTIPOLYGON, `Site.geom_pt` POINT, SRID 4326).
- **Schemas**: Marshmallow (de)serialization in `schemas/metier.py`.
- **Config modules**: `configs/logger_config.py`, `configs/mail_config.py` — distinct from the root `config.py`.
- Root-level scripts (`add_*_column.py`, `cleanup_ghost_data.py`, `feed_*.py`, `questions.py`) are one-off maintenance/seed utilities run manually.

### Domain model (the part that spans many files)

`Nomenclature` (`t_nomenclatures`) is the **universal lookup table**: themes, question sub-themes, actor categories, cognitive profiles, interview statuses, site types, habitats, and the allowed answer values (`choix_reponses`). Almost every FK named `*_id` on other models points at it. When adding a typed field, add a nomenclature entry rather than an enum column.

Main chain: `Diagnostic` → `Acteur` (interviewees) → `Reponse` (one per acteur×question, enforced by `uq_acteur_question`) → `MotCle` (keywords, self-referencing via `mots_cles_groupe`) → `Afom` (AFOM/SWOT scoring). `Diagnostic` links to `Site` many-to-many via `cor_sites_diagnostics`; `Site` links to `Departement` and habitats.

Two business rules that are easy to miss:
- **Read-only diagnostics**: a diagnostic is editable only when `created_by == current user id_role` and `is_read_only` is false; `is_disabled` soft-deletes. The frontend recomputes this per component.
- **CCG questionnaire branching**: whether an actor belongs to the "Membres ou participants au CCG" category changes which questions are required for interview-status computation, and the "Changement climatique et biodiversité" sub-theme is always optional — see `routes/functions.py`.

`routes/diagnostics.py` is the largest module (~1000 lines) and holds the chart aggregation endpoints (`/diagnostics/charts/average|repartition|radars`) plus their per-diagnostic parameter updates and the Excel import.

## Frontend Architecture

- **Routing** (`app.routes.ts`): every route is a child of `NavHomeComponent` **from the `home-rnf` submodule** and guarded by that submodule's `authGuard`. Login, forgot-password, `AuthService` (`getCurrentUser()`), and logout also come from `@app/home-rnf/...`. Don't reimplement auth in this repo — extend the submodule.
- **Models** (`models/`): each model implements `copy()`, static `fromJson(data: Interface)`, and `toJson()`, with a matching interface in `interfaces/`. Models have **no constructor** so instances can be created with default field values. Creating or changing a model means updating all three methods and the interface — `documentation_technique.md` documents the exact per-field-type patterns (scalar / object / array). `graph-*.model.ts` are chart view models.
- **Services** (`services/`): one per model, returning `Observable<Model>` mapped through `fromJson`. Geographic services (region/departement/commune) extend **`BaseEntityService<TModel, TInterface>`** (`base-entity.service.ts`), which centralizes `getAll`, the Bearer-token header, `shareReplay`, and `fromJson` mapping.
- **`StateService`** holds cross-component reactive state (current diagnostic, current acteur, navigation breadcrumbs) as `BehaviorSubject`s with localStorage backup and validation. Prefer it over reading `localStorage` directly in components.
- **Components** (`components/`): feature areas (diagnostic, entretien, site, acteur, ancrage, diagnostic-visualisation, mes-diagnostics…). `components/parts/` = reusable children (map, graphiques, listes, imports); `components/alertes/` = modal dialogs. The stated philosophy is maximum reuse of variables, methods and components.
- **Labels**: all user-facing strings live in the `Labels` class in `utils/labels.ts` — instantiate it and use it from the template. Beware: Angular exports a homonymous `Labels`; import the project one.
- **Styling**: Angular Material with a custom theme in `src/styles/`, plus Bootstrap and the legacy `assets/css/*.css` (webflow/RNF site). `postcss.config.js` references a `tailwindcss` plugin that is not installed — Tailwind is effectively inert; don't write Tailwind classes.
- `dexie` is declared in `package.json` but is not imported anywhere in the source; there is no working offline/IndexedDB cache today.

## Angular 19 Conventions (follow these)

- **Standalone components** with explicit `imports: [...]` — no NgModules, no `standalone: true` (it's the default). Providers are configured in `main.ts` via `bootstrapApplication`.
- **`inject()`** over constructor injection: `private siteService = inject(SiteService);`
- **Signals** for state: `diagnostic = signal<Diagnostic>(new Diagnostic());` — read with `this.diagnostic()`.
- **`effect()`** in the constructor instead of `ngOnInit`/`ngAfterViewInit`.
- **Input signals**: `data = input<any>();` instead of `@Input()`. They are read-only — copy into a local variable if the component mutates the value.
- **`@if` / `@for`** control flow instead of `*ngIf` / `*ngFor`.
- Use `forkJoin` for parallel API calls; anything still using `Subscription` must unsubscribe in `ngOnDestroy`.
- Path aliases: `@app/*`, `@services/*`, `@assets/*`.

## Database & Migrations

PostgreSQL with PostGIS. On model changes: `flask db migrate -m "..."` then `flask db upgrade`. **`backend/migrations/` is gitignored**, so migrations are environment-local — coordinate schema changes via model edits and regeneration, never by committing migration files.

## Notes

- Linux-targeted (use WSL on Windows).
- Numerous console errors from JS files at app startup are known-benign.
