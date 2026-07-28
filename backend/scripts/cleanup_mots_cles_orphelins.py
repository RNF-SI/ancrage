#!/usr/bin/env python3
"""
Supprime les mots-clés fantômes qui gonflaient le comptage de l'AFOM.

Avant correction, chaque enregistrement d'une réponse d'entretien recréait une
ligne dans t_mots_cles au lieu de réutiliser l'existante. Les lignes précédentes
restaient en base sans être liées à aucune réponse (« orphelines »), avec
nombre = 1, et l'écran AFOM additionnait les lignes de même nom : un mot-clé cité
par un seul acteur pouvait donc s'afficher 2, 3 ou 4 fois.

Ce script ne touche QUE les mots-clés orphelins, puis recalcule l'AFOM.
Contrairement à cleanup_ghost_data.py, il ne supprime aucun acteur et ne modifie
aucune contrainte de la base.

Usage (depuis le répertoire backend/) :
  python3 scripts/cleanup_mots_cles_orphelins.py --all --dry-run
  python3 scripts/cleanup_mots_cles_orphelins.py 89 --dry-run
  python3 scripts/cleanup_mots_cles_orphelins.py 89 --execute
"""

import argparse
import os
import sys

# Permet d'exécuter le script depuis backend/ : python3 scripts/...
_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)

from app import create_app
from models.models import Diagnostic, MotCle, db
from routes.reponses import (
    get_linked_mot_cle_ids_for_diagnostic,
    recalculate_afom_for_diagnostic,
)


def trouver_orphelins(diagnostic_id):
    """Mots-clés du diagnostic qui ne sont liés à aucune réponse d'acteur."""
    ids_lies = get_linked_mot_cle_ids_for_diagnostic(diagnostic_id)

    query = MotCle.query.filter(MotCle.diagnostic_id == diagnostic_id)
    if ids_lies:
        query = query.filter(~MotCle.id_mot_cle.in_(ids_lies))

    # Un mot-clé ajouté à la main dans l'écran d'analyse n'est lié à aucune
    # réponse : on ne le supprime que s'il fait doublon avec un mot-clé
    # réellement issu d'un entretien.
    noms_lies = set()
    if ids_lies:
        noms_lies = {
            nom.strip().casefold()
            for (nom,) in db.session.query(MotCle.nom)
            .filter(MotCle.id_mot_cle.in_(ids_lies))
            .all()
            if nom
        }

    orphelins = []
    conserves = []
    for mot_cle in query.order_by(MotCle.id_mot_cle).all():
        if mot_cle.mots_cles_issus:
            conserves.append((mot_cle, "parent d'un groupe"))
            continue
        if (mot_cle.nom or "").strip().casefold() not in noms_lies:
            conserves.append((mot_cle, "ajouté manuellement, sans doublon"))
            continue
        orphelins.append(mot_cle)

    return orphelins, conserves


def traiter_diagnostic(diagnostic_id, *, execute):
    orphelins, conserves = trouver_orphelins(diagnostic_id)

    print(f"\n— Diagnostic {diagnostic_id} : {len(orphelins)} mot(s)-clé(s) fantôme(s)")

    for mot_cle, raison in conserves:
        print(f"     · conservé id={mot_cle.id_mot_cle} « {mot_cle.nom} » ({raison})")

    for mot_cle in orphelins:
        action = "suppression" if execute else "à supprimer"
        print(f"     - {action} id={mot_cle.id_mot_cle} « {mot_cle.nom} » (nombre={mot_cle.nombre})")
        if execute:
            db.session.delete(mot_cle)

    if execute:
        db.session.commit()
        recalculate_afom_for_diagnostic(diagnostic_id)
        print(f"     ✅ AFOM recalculé pour le diagnostic {diagnostic_id}")

    return len(orphelins)


def run(diagnostic_ids, *, execute):
    mode = "EXÉCUTION" if execute else "APERÇU (dry-run)"
    print(f"=== Nettoyage des mots-clés fantômes — {mode} ===")

    total = 0
    for diagnostic_id in diagnostic_ids:
        if not db.session.get(Diagnostic, diagnostic_id):
            print(f"\n— Diagnostic {diagnostic_id} : introuvable, ignoré.")
            continue
        total += traiter_diagnostic(diagnostic_id, execute=execute)

    print(f"\nTotal : {total} mot(s)-clé(s) fantôme(s).")
    if not execute:
        print("ℹ Aucune modification effectuée. Relancez avec --execute pour appliquer.")
    return 0


def main():
    parser = argparse.ArgumentParser(
        description="Supprime les mots-clés orphelins gonflant l'AFOM, puis recalcule l'AFOM."
    )
    parser.add_argument(
        "diagnostic_ids",
        nargs="*",
        type=int,
        help="Identifiants des diagnostics à traiter.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Traite tous les diagnostics de la base.",
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true", help="Aperçu sans modification.")
    group.add_argument("--execute", action="store_true", help="Applique les suppressions.")
    args = parser.parse_args()

    if not args.diagnostic_ids and not args.all:
        parser.error("Indiquez au moins un identifiant de diagnostic, ou --all.")

    app = create_app()
    with app.app_context():
        diagnostic_ids = args.diagnostic_ids
        if args.all:
            diagnostic_ids = [
                row[0]
                for row in db.session.query(Diagnostic.id_diagnostic)
                .order_by(Diagnostic.id_diagnostic)
                .all()
            ]
        try:
            return run(diagnostic_ids, execute=args.execute)
        except Exception as exc:
            db.session.rollback()
            print(f"\n❌ Erreur : {exc}", file=sys.stderr)
            return 1


if __name__ == "__main__":
    sys.exit(main())
