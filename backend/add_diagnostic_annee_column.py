#!/usr/bin/env python3
"""
Ajoute la colonne annee à t_diagnostics et la remplit depuis le nom.

Actions :
  1. Ajoute annee (INTEGER) si absente
  2. Remplit annee avec les 4 derniers caractères de nom (convertis en entier)

Usage :
  python3 add_diagnostic_annee_column.py --dry-run
  python3 add_diagnostic_annee_column.py --execute
"""

import argparse
import re
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


def extract_annee_from_nom(nom: Optional[str]) -> Optional[int]:
    if not nom:
        return None

    suffix = nom.strip()[-4:]
    if not re.fullmatch(r"\d{4}", suffix):
        return None

    year = int(suffix)
    if year < 1900 or year > 2100:
        return None

    return year


def load_diagnostics() -> list[tuple[int, str]]:
    rows = db.session.execute(
        text(
            """
            SELECT id_diagnostic, nom
            FROM t_diagnostics
            ORDER BY id_diagnostic
            """
        )
    ).fetchall()
    return [(row[0], row[1]) for row in rows]


def run(*, execute: bool) -> int:
    print("=== Colonne annee sur t_diagnostics ===\n")

    has_annee = column_exists("t_diagnostics", "annee")
    print(f"  → colonne annee existante : {has_annee}")

    diagnostics = load_diagnostics()
    print(f"  → diagnostics trouvés : {len(diagnostics)}\n")

    updates: list[tuple[int, str, Optional[int]]] = []
    for diag_id, nom in diagnostics:
        annee = extract_annee_from_nom(nom)
        updates.append((diag_id, nom, annee))

    fillable = [item for item in updates if item[2] is not None]
    skipped = [item for item in updates if item[2] is None]

    print(f"  → diagnostics remplissables : {len(fillable)}")
    print(f"  → diagnostics ignorés : {len(skipped)}\n")

    print("=== Exemples de remplissage ===\n")
    for diag_id, nom, annee in fillable[:10]:
        print(f"  id={diag_id} → annee={annee} | {nom}")

    if len(fillable) > 10:
        print(f"  ... et {len(fillable) - 10} autre(s)")

    if skipped:
        print("\n=== Exemples ignorés ===\n")
        for diag_id, nom, _ in skipped[:5]:
            suffix = (nom or "").strip()[-4:]
            print(f"  id={diag_id} | suffixe='{suffix}' | {nom}")
        if len(skipped) > 5:
            print(f"  ... et {len(skipped) - 5} autre(s)")

    if not execute:
        print("\nMode --dry-run : aucune modification appliquée.")
        if not has_annee:
            print("SQL prévu : ALTER TABLE t_diagnostics ADD COLUMN annee INTEGER")
        return 0

    if not has_annee:
        db.session.execute(text("ALTER TABLE t_diagnostics ADD COLUMN annee INTEGER"))
        db.session.commit()
        print("✅ Colonne annee ajoutée.")

    updated_count = 0
    for diag_id, nom, annee in updates:
        if annee is None:
            continue
        db.session.execute(
            text("UPDATE t_diagnostics SET annee = :annee WHERE id_diagnostic = :id"),
            {"annee": annee, "id": diag_id},
        )
        updated_count += 1

    db.session.commit()
    print(f"✅ {updated_count} diagnostic(s) mis à jour.")
    return 0


def main():
    parser = argparse.ArgumentParser(
        description="Ajoute annee à t_diagnostics et la remplit depuis nom."
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
