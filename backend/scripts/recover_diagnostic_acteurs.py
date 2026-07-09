#!/usr/bin/env python3
"""
Restaure les acteurs d'origine d'un diagnostic après recopie accidentelle.

Usage :
  python3 scripts/recover_diagnostic_acteurs.py 89 --dry-run
  python3 scripts/recover_diagnostic_acteurs.py 89 --execute
"""

import argparse
import sys

from app import create_app
from models.models import Acteur, Reponse, db
from routes.reponses import recalculate_afom_for_diagnostic, verifDatesEntretien


def audit(diagnostic_id: int) -> dict:
    copies = (
        Acteur.query
        .filter_by(diagnostic_id=diagnostic_id, is_deleted=False)
        .filter(Acteur.is_copy.is_(True))
        .all()
    )
    origin_ids = {c.acteur_origine_id for c in copies if c.acteur_origine_id}
    origins = Acteur.query.filter(Acteur.id_acteur.in_(origin_ids)).all() if origin_ids else []

    copies_with_responses = [
        c for c in copies
        if Reponse.query.filter_by(acteur_id=c.id_acteur).count() > 0
    ]
    copies_without_origin = [c for c in copies if not c.acteur_origine_id]
    missing_origins = [
        c for c in copies
        if c.acteur_origine_id and not any(o.id_acteur == c.acteur_origine_id for o in origins)
    ]

    return {
        "copies": copies,
        "origins": origins,
        "copies_with_responses": copies_with_responses,
        "copies_without_origin": copies_without_origin,
        "missing_origins": missing_origins,
    }


def print_audit(data: dict, diagnostic_id: int) -> None:
    print(f"\n=== Diagnostic {diagnostic_id} ===\n")
    print(f"Copies sur le diagnostic : {len(data['copies'])}")
    for c in data["copies"]:
        nb = Reponse.query.filter_by(acteur_id=c.id_acteur).count()
        print(f"  - copie id={c.id_acteur} origine={c.acteur_origine_id} réponses={nb} ({c.prenom} {c.nom})")

    print(f"\nActeurs d'origine à restaurer : {len(data['origins'])}")
    for o in data["origins"]:
        nb = Reponse.query.filter_by(acteur_id=o.id_acteur).count()
        print(f"  - origine id={o.id_acteur} diagnostic_id={o.diagnostic_id} réponses={nb} ({o.prenom} {o.nom})")

    if data["copies_with_responses"]:
        print(f"\n⚠️  {len(data['copies_with_responses'])} copie(s) ont des réponses — arrêt.")
    if data["copies_without_origin"]:
        print(f"\n⚠️  {len(data['copies_without_origin'])} copie(s) sans acteur_origine_id — arrêt.")
    if data["missing_origins"]:
        print(f"\n⚠️  {len(data['missing_origins'])} origine(s) introuvable(s) — arrêt.")


def can_recover(data: dict) -> bool:
    return not data["copies_with_responses"] and not data["copies_without_origin"] and not data["missing_origins"]


def recover(diagnostic_id: int, *, execute: bool) -> int:
    data = audit(diagnostic_id)
    print_audit(data, diagnostic_id)

    if not data["copies"]:
        print("\nAucune copie à traiter.")
        return 0

    if not can_recover(data):
        print("\n❌ Conditions de sécurité non remplies. Aucune modification.")
        return 1

    if not execute:
        print("\n✅ Aperçu OK. Relancer avec --execute pour appliquer.")
        return 0

    for origin in data["origins"]:
        origin.diagnostic_id = diagnostic_id
        db.session.add(origin)

    for copy in data["copies"]:
        db.session.delete(copy)

    db.session.commit()
    recalculate_afom_for_diagnostic(diagnostic_id)
    verifDatesEntretien(diagnostic_id)

    print(f"\n✅ Diagnostic {diagnostic_id} restauré ({len(data['origins'])} acteur(s), {len(data['copies'])} copie(s) supprimée(s)).")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Restaure les acteurs d'origine d'un diagnostic.")
    parser.add_argument("diagnostic_id", type=int)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true")
    group.add_argument("--execute", action="store_true")
    args = parser.parse_args()

    app = create_app()
    with app.app_context():
        return recover(args.diagnostic_id, execute=args.execute)


if __name__ == "__main__":
    sys.exit(main())
