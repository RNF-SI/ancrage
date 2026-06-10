#!/usr/bin/env python3
"""
Nettoie la base Ancrage des données fantômes liées à l'ancien soft delete des acteurs.

Actions :
  1. Supprime la contrainte FK sur t_acteurs.acteur_origine_id (si elle existe)
  2. Supprime définitivement les acteurs marqués is_deleted = true
  3. Supprime les mots-clés orphelins par diagnostic
  4. Recalcule l'AFOM général (t_afom) pour chaque diagnostic

Usage :
  python3 cleanup_ghost_data.py --dry-run    # aperçu sans modification
  python3 cleanup_ghost_data.py --execute    # applique les changements
"""

import argparse
import sys

from sqlalchemy import text

from app import create_app
from models.models import Acteur, Diagnostic, MotCle, db
from routes.acteurs import delete_acteur_and_related_data
from routes.reponses import (
    cleanup_orphan_mots_cles_for_diagnostic,
    get_linked_mot_cle_ids_for_diagnostic,
    recalculate_afom_for_diagnostic,
)


def find_acteur_origine_fk_constraints():
    return db.session.execute(
        text(
            """
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_schema = kcu.constraint_schema
             AND tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 't_acteurs'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'acteur_origine_id'
            """
        )
    ).fetchall()


def count_orphan_mots_cles(diagnostic_id):
    linked_ids = get_linked_mot_cle_ids_for_diagnostic(diagnostic_id)
    query = MotCle.query.filter(MotCle.diagnostic_id == diagnostic_id)
    if linked_ids:
        query = query.filter(~MotCle.id_mot_cle.in_(linked_ids))
    return query.count()


def drop_acteur_origine_fk(*, execute: bool) -> list[str]:
    constraints = [row[0] for row in find_acteur_origine_fk_constraints()]
    if not constraints:
        print("  → Aucune contrainte FK sur acteur_origine_id.")
        return constraints

    for name in constraints:
        print(f"  → Contrainte FK à supprimer : {name}")
        if execute:
            db.session.execute(text(f'ALTER TABLE t_acteurs DROP CONSTRAINT IF EXISTS "{name}"'))
    if execute:
        db.session.commit()
    return constraints


def delete_soft_deleted_acteurs(*, execute: bool) -> list[Acteur]:
    acteurs = Acteur.query.filter_by(is_deleted=True).order_by(Acteur.id_acteur).all()
    print(f"  → {len(acteurs)} acteur(s) soft-deleted trouvé(s).")
    if not execute:
        for acteur in acteurs:
            print(
                f"     - id={acteur.id_acteur} "
                f"({acteur.prenom} {acteur.nom}), diagnostic_id={acteur.diagnostic_id}"
            )
        return acteurs

    for acteur in acteurs:
        print(
            f"     - suppression id={acteur.id_acteur} "
            f"({acteur.prenom} {acteur.nom}), diagnostic_id={acteur.diagnostic_id}"
        )
        delete_acteur_and_related_data(acteur)
    return acteurs


def cleanup_diagnostics(*, execute: bool) -> list[int]:
    diagnostic_ids = [
        row[0]
        for row in db.session.query(Diagnostic.id_diagnostic).order_by(Diagnostic.id_diagnostic).all()
    ]
    print(f"  → {len(diagnostic_ids)} diagnostic(s) à traiter.")

    for diagnostic_id in diagnostic_ids:
        orphans = count_orphan_mots_cles(diagnostic_id)
        print(f"     - diagnostic {diagnostic_id} : {orphans} mot(s)-clé(s) orphelin(s)")
        if not execute:
            continue
        cleanup_orphan_mots_cles_for_diagnostic(diagnostic_id)
        db.session.commit()
        recalculate_afom_for_diagnostic(diagnostic_id)

    return diagnostic_ids


def run(*, execute: bool) -> int:
    mode = "EXÉCUTION" if execute else "APERÇU (dry-run)"
    print(f"\n=== Nettoyage des données fantômes — {mode} ===\n")

    print("1. Contrainte FK acteur_origine_id")
    drop_acteur_origine_fk(execute=execute)

    print("\n2. Acteurs soft-deleted (is_deleted = true)")
    delete_soft_deleted_acteurs(execute=execute)

    print("\n3. Mots-clés orphelins et recalcul AFOM par diagnostic")
    cleanup_diagnostics(execute=execute)

    if execute:
        print("\n✅ Nettoyage terminé.")
    else:
        print("\nℹ Aucune modification effectuée. Relancez avec --execute pour appliquer.")

    return 0


def main():
    parser = argparse.ArgumentParser(description="Nettoie la base des données fantômes Ancrage.")
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
