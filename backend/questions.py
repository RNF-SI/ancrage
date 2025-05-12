from app import create_app, db
from models.models import Question, Reponse, Nomenclature
from sqlalchemy.orm import load_only

app = create_app()

with app.app_context():
 # TRUNCATE ciblé sans toucher à Region, Departement, Commune
    tables_to_truncate = [
        "t_nomenclatures",
        "t_questions",
        "t_reponses",
        "t_mots_cles",
        "cor_reponses_mots_cles",
        "cor_question_acteur"
    ]

    for table in tables_to_truncate:
        db.session.execute(f'TRUNCATE {table} RESTART IDENTITY CASCADE')
    db.session.commit()

    THEME_MNEMONIQUE = "thème"
    THEME_LIBELLE = "Connaissance"

    # Création ou récupération du thème
    theme = Nomenclature.query.filter_by(mnemonique=THEME_MNEMONIQUE).first()
    if not theme:
        theme = Nomenclature(libelle=THEME_LIBELLE, mnemonique=THEME_MNEMONIQUE)
        db.session.add(theme)
        db.session.commit()
        print(f"Thème 'connaissance' créé avec ID : {theme.id_nomenclature}")
    else:
        print(f"Thème 'connaissance' déjà présent (ID : {theme.id_nomenclature})")

    question_labels = [
        "Selon vous, quelles sont les missions d'une réserve naturelle, en général ?",
        "Concrètement, savez-vous ce qui se fait sur cette réserve ?",
        "Connaissez-vous des animations proposées par la réserve et lesquelles ?",
        "Connaissez-vous les organismes gestionnaires de la réserve ?",
        "Voulez-vous bien tracer le périmètre de la réserve sur une carte ?",
        "Connaissez-vous des règles à respecter sur la réserve ?",
        "Selon vous, quelles sont les espèces emblématiques de la réserve ?",
        "Parmi les documents suivants, lesquels connaissez-vous ?",
        "Vers qui vous tournez-vous pour avoir des informations ?",
        "Les informations sur la RN sont-elles accessibles ?"
    ]

    score_texts = [
        ["Faux ou non réponse", "Faux ou non réponse", "Non réponse", "Faux ou non réponse", "Méconnaissance",
         "Non connue", "Faux ou Non connu", "Ne connaît aucun des documents qui lui sont destinés",
         "FAUX ou non réponse", "Non"],
        
        ["1 mission", "1", "x", "x", "Localisation peu assurée",
         "x", "x", "x", "x", "Peu accessible"],
        
        ["//si 2 bonnes réponses et 1 réponse fausse//", "2", "moins de 50 %", "Incomplet", "Localisation globalement correcte",
         "Connaissance floue", "Des espèces mais pas celles attendues", "Connaît approximativement la documentation",
         "Structure gestionnaire ou propriétaire", "Peu accessible"],
        
        ["2 missions claires", "3", "x", "x", "Bon tracé, quelques approximations peu problématiques",
         "x", "x", "x", "x", "x"],
        
        ["3 missions", "4 ou 5", "plus de 50% des animations connues", "Complet", "Périmètre exact",
         "Principales réglementations", "Vrai (au moins 1 espèce emblématique)", "Connaît tous les documents qui lui sont destinés",
         "Conservateur.trice ou membre équipe", "Facilement accessible"]
    ]

    
    existing_questions = {q.libelle for q in Question.query.options(load_only(Question.libelle)).all()}
    existing_nomenclatures = {
        (n.libelle.strip(), n.value): n
        for n in Nomenclature.query.filter_by(mnemonique="reponse_score").all()
    }

    for col_idx, label in enumerate(question_labels):
        if label in existing_questions:
            print(f"[!] Question déjà présente : {label}")
            continue

        # Ajouter les indications à partir du score 1 (par convention ici)
        indications = score_texts[0][col_idx]

        question = Question(
            libelle=label,
            theme=theme,
            indications=indications
        )
        db.session.add(question)
        db.session.flush()

        for score in range(1, 6):
            text = score_texts[score - 1][col_idx].strip()
            if text.lower() == 'x' or not text:
                continue

            key = (text, score)
            if key in existing_nomenclatures:
                nom = existing_nomenclatures[key]
            else:
                nom = Nomenclature(libelle=text, value=score, mnemonique="reponse_score")
                db.session.add(nom)
                db.session.flush()
                existing_nomenclatures[key] = nom

            reponse = Reponse(
                valeur_reponse_id=nom.id_nomenclature,
                question_id=question.id_question
            )
            db.session.add(reponse)

    db.session.commit()
    print("✅ Questions avec indications et réponses enregistrées avec succès.")
