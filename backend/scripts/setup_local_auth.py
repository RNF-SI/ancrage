#!/usr/bin/env python3
"""
Monte l'authentification locale d'ancrage pour le développement.

En production, ancrage ne stocke pas ses utilisateurs : le schéma `utilisateurs`
de sa base est composé de tables ÉTRANGÈRES pointant, via postgres_fdw et le
serveur `gn_global`, vers la base geonature_global installée sur la même machine.

Ce script reconstitue ce montage en local :
  1. crée une base geonature_global MINIMALE (schéma utilisateurs seulement),
     à partir du DDL extrait du dump (scripts/local_geonature_global.sql) ;
  2. y insère un compte de test avec les droits sur l'application ancrage ;
  3. réaligne le serveur étranger sur le port local et le compte de test.

Usage (depuis backend/, venv actif) :
  python3 scripts/setup_local_auth.py --dry-run
  python3 scripts/setup_local_auth.py --execute
"""

import argparse
import os
import sys

# Permet d'exécuter le script depuis backend/ : python3 scripts/...
_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

import bcrypt
import psycopg2
from psycopg2 import sql

DDL = os.path.join(_BACKEND_ROOT, "scripts", "local_geonature_global.sql")

# Doit correspondre à CODE_APPLICATION de config.py : c'est sur ce code que
# pypnusershub filtre les utilisateurs (User.filter_by_app).
CODE_APPLICATION = "ANCRAGE"
# Le frontend envoie ID_APPLICATION_GEONATURE (src/conf/app.config.ts) au login,
# et pypnusershub fait un get(Application, id_app) : l'id doit exister.
ID_APPLICATION = 5

COMPTE_TEST = {"identifiant": "ancrage", "motdepasse": "ancrage", "id_role": 1}


def connect(dbname, user, password, host, port):
    conn = psycopg2.connect(
        dbname=dbname, user=user, password=password, host=host, port=port
    )
    conn.autocommit = True
    return conn


def creer_base(admin, nom):
    with admin.cursor() as cur:
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (nom,))
        if cur.fetchone():
            print(f"  → base {nom} déjà présente")
            return False
        cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(nom)))
        print(f"  → base {nom} créée")
        return True


def creer_schema(conn):
    with open(DDL, encoding="utf-8") as f:
        ddl = f.read()
    with conn.cursor() as cur:
        cur.execute(ddl)
    print(f"  → schéma utilisateurs créé ({DDL})")


def peupler(conn, role_app):
    """Insère le strict minimum pour qu'un login aboutisse."""
    hash_pw = bcrypt.hashpw(
        COMPTE_TEST["motdepasse"].encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO utilisateurs.bib_organismes
                (id_organisme, uuid_organisme, nom_organisme)
            VALUES (1, gen_random_uuid(), 'Organisme de test')
            ON CONFLICT (id_organisme) DO NOTHING
            """
        )
        cur.execute(
            """
            INSERT INTO utilisateurs.t_applications
                (id_application, code_application, nom_application)
            VALUES (%s, %s, 'Ancrage (local)')
            ON CONFLICT (id_application) DO UPDATE SET code_application = EXCLUDED.code_application
            """,
            (ID_APPLICATION, CODE_APPLICATION),
        )
        cur.execute(
            """
            INSERT INTO utilisateurs.t_profils (id_profil, code_profil, nom_profil)
            VALUES (6, 6, 'Administrateur')
            ON CONFLICT (id_profil) DO NOTHING
            """
        )
        # pypnusershub plante si le provider n'existe pas déjà : dans
        # LocalProvider.authenticate, la branche de création appelle
        # db.session.add() sans argument.
        cur.execute(
            """
            INSERT INTO utilisateurs.t_providers (id_provider, name)
            VALUES (1, 'local_provider')
            ON CONFLICT (id_provider) DO NOTHING
            """
        )
        cur.execute(
            """
            INSERT INTO utilisateurs.t_roles
                (id_role, groupe, uuid_role, identifiant, nom_role, prenom_role,
                 pass_plus, email, id_organisme, active)
            VALUES (%s, false, gen_random_uuid(), %s, 'Test', 'Ancrage',
                    %s, 'test@example.invalid', 1, true)
            ON CONFLICT (id_role) DO UPDATE SET pass_plus = EXCLUDED.pass_plus
            """,
            (COMPTE_TEST["id_role"], COMPTE_TEST["identifiant"], hash_pw),
        )
        cur.execute(
            """
            INSERT INTO utilisateurs.cor_role_app_profil
                (id_role, id_application, id_profil, is_default_group_for_app)
            SELECT %s, %s, 6, false
            WHERE NOT EXISTS (
                SELECT 1 FROM utilisateurs.cor_role_app_profil
                WHERE id_role = %s AND id_application = %s
            )
            """,
            (COMPTE_TEST["id_role"], ID_APPLICATION,
             COMPTE_TEST["id_role"], ID_APPLICATION),
        )
        # Le rôle applicatif doit pouvoir lire ces tables à travers le FDW.
        cur.execute(
            sql.SQL("GRANT USAGE ON SCHEMA utilisateurs TO {}").format(
                sql.Identifier(role_app)
            )
        )
        cur.execute(
            sql.SQL(
                "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES "
                "IN SCHEMA utilisateurs TO {}"
            ).format(sql.Identifier(role_app))
        )
    print(f"  → compte de test « {COMPTE_TEST['identifiant']} » "
          f"(mot de passe « {COMPTE_TEST['motdepasse']} ») avec droits sur "
          f"l'application {ID_APPLICATION}/{CODE_APPLICATION}")


def realigner_fdw(conn, port, role_app, mdp_app):
    """Le serveur étranger vient de la production : port et compte à corriger."""
    with conn.cursor() as cur:
        # Droits sur les tables ÉTRANGÈRES elles-mêmes, côté base ancrage : ils
        # sont distincts de ceux accordés sur les tables réelles de
        # geonature_global. Sans eux, le login échoue à l'insertion dans
        # utilisateurs.cor_role_provider.
        cur.execute(
            sql.SQL("GRANT USAGE ON SCHEMA utilisateurs TO {}").format(
                sql.Identifier(role_app)
            )
        )
        cur.execute(
            sql.SQL(
                "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES "
                "IN SCHEMA utilisateurs TO {}"
            ).format(sql.Identifier(role_app))
        )
        cur.execute("ALTER SERVER gn_global OPTIONS (SET port %s)" % f"'{port}'")
        cur.execute(
            sql.SQL(
                "ALTER USER MAPPING FOR {} SERVER gn_global "
                "OPTIONS (SET \"user\" %s, SET password %s)"
            ).format(sql.Identifier(role_app)),
            (role_app, mdp_app),
        )
    print(f"  → serveur étranger gn_global réaligné sur le port {port}, "
          f"compte distant « {role_app} »")


def verifier(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM utilisateurs.t_roles")
        roles = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM utilisateurs.t_applications")
        apps = cur.fetchone()[0]
    print(f"  → lecture à travers le FDW : {roles} rôle(s), {apps} application(s)")


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--host", default="127.0.0.1")
    p.add_argument("--port", default="5433")
    p.add_argument("--admin-user", default="geonatadmin",
                   help="rôle superutilisateur du cluster local")
    p.add_argument("--admin-password", default=os.environ.get("PGADMINPASS", ""))
    p.add_argument("--app-user", default="ancrage")
    p.add_argument("--app-password", default="ancrage")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--dry-run", action="store_true")
    g.add_argument("--execute", action="store_true")
    args = p.parse_args()

    if args.dry_run:
        print("APERÇU — aucune modification.")
        print(f"  base geonature_global sur {args.host}:{args.port}")
        print(f"  compte de test « {COMPTE_TEST['identifiant']} »")
        print(f"  application {ID_APPLICATION} / {CODE_APPLICATION}")
        print(f"  serveur étranger gn_global -> port {args.port}, "
              f"compte « {args.app_user} »")
        return 0

    admin = connect("postgres", args.admin_user, args.admin_password,
                    args.host, args.port)
    print("1. Base geonature_global")
    creer_base(admin, "geonature_global")
    admin.close()

    gn = connect("geonature_global", args.admin_user, args.admin_password,
                 args.host, args.port)
    print("2. Schéma et compte de test")
    creer_schema(gn)
    peupler(gn, args.app_user)
    gn.close()

    anc = connect("ancrage", args.admin_user, args.admin_password,
                  args.host, args.port)
    print("3. Serveur étranger")
    realigner_fdw(anc, args.port, args.app_user, args.app_password)
    anc.close()

    print("4. Vérification (lecture des tables étrangères)")
    app = connect("ancrage", args.app_user, args.app_password,
                  args.host, args.port)
    verifier(app)
    app.close()

    print("\n✅ Authentification locale prête.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
