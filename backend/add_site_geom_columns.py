#!/usr/bin/env python3
"""
Ajoute les colonnes géographiques aux sites Ancrage.

Actions :
  1. Supprime une éventuelle colonne geom de type POINT (ancienne version)
  2. Ajoute geom (MULTIPOLYGON, SRID 4326) si absente
  3. Ajoute geom_pt (POINT, SRID 4326) si absente
  4. Remplit geom_pt depuis position_x / position_y quand c'est possible
  5. Recalcule geom_pt comme centroïde de geom pour les sites ayant un polygone

Usage :
  python3 add_site_geom_columns.py --dry-run
  python3 add_site_geom_columns.py --execute
"""

import argparse
import sys
from typing import Optional

from sqlalchemy import text

from app import create_app
from models.models import db


def column_exists(table_name: str, column_name: str) -> bool:
    row = db.session.execute(
        text(
            """
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = :table
              AND column_name = :column
            """
        ),
        {"table": table_name, "column": column_name},
    ).first()
    return row is not None


def column_type(table_name: str, column_name: str) -> Optional[str]:
    row = db.session.execute(
        text(
            """
            SELECT udt_name
            FROM information_schema.columns
            WHERE table_name = :table
              AND column_name = :column
            """
        ),
        {"table": table_name, "column": column_name},
    ).first()
    return row[0] if row else None


def count_sites_with_geom_pt() -> int:
    if not column_exists("t_sites", "geom_pt"):
        return 0
    return db.session.execute(
        text("SELECT COUNT(*) FROM t_sites WHERE geom_pt IS NOT NULL")
    ).scalar() or 0


def count_sites_backfillable_from_positions() -> int:
    position_filter = """
        position_x ~ '^[+-]?[0-9]+(\\.[0-9]+)?$'
        AND position_y ~ '^[+-]?[0-9]+(\\.[0-9]+)?$'
    """
    if column_exists("t_sites", "geom_pt"):
        return db.session.execute(
            text(
                f"""
                SELECT COUNT(*)
                FROM t_sites
                WHERE geom_pt IS NULL
                  AND {position_filter}
                """
            )
        ).scalar() or 0
    return db.session.execute(
        text(f"SELECT COUNT(*) FROM t_sites WHERE {position_filter}")
    ).scalar() or 0


def count_sites_with_polygon() -> int:
    if not column_exists("t_sites", "geom"):
        return 0
    return db.session.execute(
        text("SELECT COUNT(*) FROM t_sites WHERE geom IS NOT NULL")
    ).scalar() or 0


def run(*, execute: bool) -> int:
    print("=== Colonnes géographiques des sites ===\n")

    has_geom = column_exists("t_sites", "geom")
    has_geom_pt = column_exists("t_sites", "geom_pt")
    geom_type = column_type("t_sites", "geom") if has_geom else None

    print(f"  → geom existante : {has_geom} ({geom_type or 'n/a'})")
    print(f"  → geom_pt existante : {has_geom_pt}")
    print(f"  → sites avec geom_pt : {count_sites_with_geom_pt()}")
    print(f"  → sites avec polygone geom : {count_sites_with_polygon()}")
    print(f"  → sites backfillables depuis position_x/y : {count_sites_backfillable_from_positions()}")

    if has_geom and geom_type == "geometry":
        # PostGIS stocke le type dans geometry_columns
        geom_detail = db.session.execute(
            text(
                """
                SELECT type
                FROM geometry_columns
                WHERE f_table_name = 't_sites'
                  AND f_geometry_column = 'geom'
                """
            )
        ).first()
        if geom_detail:
            print(f"  → type PostGIS de geom : {geom_detail[0]}")
            if geom_detail[0].upper() == "POINT":
                print("  → geom est un POINT : sera supprimée puis recréée en MULTIPOLYGON.")
                if execute:
                    db.session.execute(text("ALTER TABLE t_sites DROP COLUMN geom"))
                    db.session.commit()
                    has_geom = False

    steps = []

    if not has_geom:
        steps.append(
            "ALTER TABLE t_sites ADD COLUMN IF NOT EXISTS geom geometry(MULTIPOLYGON, 4326)"
        )

    if not has_geom_pt:
        steps.append(
            "ALTER TABLE t_sites ADD COLUMN IF NOT EXISTS geom_pt geometry(POINT, 4326)"
        )

    steps.append(
        """
        UPDATE t_sites
        SET geom_pt = ST_SetSRID(
            ST_MakePoint(position_x::double precision, position_y::double precision),
            4326
        )
        WHERE geom_pt IS NULL
          AND position_x ~ '^[+-]?[0-9]+(\\.[0-9]+)?$'
          AND position_y ~ '^[+-]?[0-9]+(\\.[0-9]+)?$'
        """
    )

    steps.append(
        """
        UPDATE t_sites
        SET geom_pt = ST_SetSRID(ST_Centroid(geom), 4326)
        WHERE geom IS NOT NULL
        """
    )

    print("\n=== Actions SQL prévues ===\n")
    for i, sql in enumerate(steps, start=1):
        print(f"{i}. {sql.strip()}\n")

    if not execute:
        print("Mode --dry-run : aucune modification appliquée.")
        return 0

    for sql in steps:
        db.session.execute(text(sql))
    db.session.commit()

    print("✅ Modifications appliquées.")
    print(f"  → sites avec geom_pt : {count_sites_with_geom_pt()}")
    print(f"  → sites avec polygone geom : {count_sites_with_polygon()}")
    return 0


def main():
    parser = argparse.ArgumentParser(
        description="Ajoute geom (MULTIPOLYGON) et geom_pt (POINT) à t_sites."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--dry-run",
        action="store_true",
        help="Affiche ce qui serait fait sans modifier la base.",
    )
    group.add_argument(
        "--execute",
        action="store_true",
        help="Applique les modifications en base.",
    )
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        try:
            return run(execute=args.execute)
        except Exception as exc:
            db.session.rollback()
            print(f"\n❌ Erreur : {exc}", file=sys.stderr)
            return 1


if __name__ == "__main__":
    sys.exit(main())
