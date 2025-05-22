from app import create_app, db
from models.models import Question, Reponse, Nomenclature
from sqlalchemy.orm import load_only

app = create_app()

def createQuestionsByTheme(THEME_MNEMONIQUE,THEME_LIBELLE,question_labels,question_labels_short,score_texts):
        
        theme = Nomenclature(libelle=THEME_LIBELLE, mnemonique=THEME_MNEMONIQUE)
        db.session.add(theme)
        db.session.commit()
       

        existing_nomenclatures = {
            (n.libelle.strip(), n.value): n
            for n in Nomenclature.query.filter_by(mnemonique="reponse_score").all()
        }

        for col_idx, (label, sht) in enumerate(zip(question_labels, question_labels_short)):
            # Les indications proviennent de la première ligne (score_texts[0])
            indications = score_texts[0][col_idx]

            question = Question(
                libelle=label,
                theme=theme,
                indications=indications,
                libelle_graphique=sht
            )
            db.session.add(question)
            db.session.flush()

            # Parcourir uniquement les lignes 1 à 5, correspondant aux scores 1 à 5
            for score_offset, score in enumerate(range(1, 6)):  # scores 1 à 5
                text = score_texts[score_offset + 1][col_idx].strip()
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

with app.app_context():
    THEME_MNEMONIQUE = "thème"
    THEME_LIBELLE = "Connaissance"
   
    question_labels = [
        "Selon vous, quelles sont les missions d'un site protégé, en général ?",
        "Concrètement, savez-vous ce qui se fait sur ce site ?",
        "Connaissez-vous des animations proposées par ce site et lesquelles ?",
        "Connaissez-vous les organismes gestionnaires du site ?",
        "Voulez-vous bien tracer le périmètre du site sur une carte ?",
        "Connaissez-vous des règles à respecter sur ce site ?",
        "Selon vous, quelles sont les espèces emblématiques du site ?",
        "Parmi les documents suivants, lesquels connaissez-vous ?",
        "Vers qui vous tournez-vous pour avoir des informations ?",
        "Les informations sur ce site sont-elles accessibles ?"
    ]
 
    question_labels_short = [
        "Connaissance des missions",
        "Connaissance des actions mises en place",
        "Connaissance des animations proposées",
        "Connaissance du gestionnaire",
        "Connaissance du périmètre",
        "Connaissance de la règlementation",
        "Connaissance des espèces emblématique",
        "Connaissance des outils de communication ",
        "Connaissance d'un interlocuteur",
        "Connaissance de médias d'information"
    ]

    score_texts = [
     
        ["Protection // Gestion // Sensibilisation",
        "Surveillance et Police // Suivis, études et inventaires, recherche // Gestion hab-esp, travaux d’entretien et d’équipement // Pédagogie, information, animation, édition // Suivi administratif et financier.",
        "Nombre cité d'animation par rapport à la programmation du site",
        "Nom exact du/des organisme(s) gestionnaire(s)",
        "Tracé du périmètre",
        "Nombre de règles citées par rapport à la réglementation en place",
        "Espèces emblématiques du site citées",
        "Nombre de documents connus par rapport à la documentation en place",
        "Nom(s) cité(s)",
        "Niveau d'accessibilité "
        ],
       
        ["Faux ou non réponse", "Faux ou non réponse", "Non réponse", "Faux ou non réponse", "Méconnaissance",
        "Non connue", "Faux ou Non connu", "Ne connaît aucun des documents qui lui sont destinés",
        "FAUX ou non réponse", "Non"],
  
        ["1 mission", "1", "x", "x", "Localisation peu assurée",
        "x", "x", "x", "x", "x"],
    
        ["//si 2 bonnes réponses et 1 réponse fausse//", "2", "moins de 50 %", "Incomplet", "Localisation globalement correcte",
        "Connaissance floue", "Des espèces mais pas celles attendues", "Connaît approximativement la documentation",
        "Structure gestionnaire ou propriétaire", "Peu accessible"],
    
        ["2 missions claires", "3", "x", "x", "Bon tracé, quelques approximations peu problématiques",
        "x", "x", "x", "x", "x"],

        ["3 missions", "4 ou 5", "plus de 50% des animations connues", "Complet", "Périmètre exact",
        "Principales réglementations", "Vrai (au moins 1 espèce emblématique)", "Connaît tous les documents qui lui sont destinés",
        "Conservateur.trice ou membre équipe", "Facilement accessible"]
    ]

    createQuestionsByTheme(THEME_MNEMONIQUE,THEME_LIBELLE,question_labels,question_labels_short,score_texts)

    THEME_MNEMONIQUE = "thème"
    THEME_LIBELLE = "Intérêt"
    question_labels = [
        "A quelle fréquence venez-vous voir la réserve pour des raisons professionnelles ou de loisirs ?",
        "Quel est votre avis sur les animations ?",
        "Quel est votre avis sur la réglementation ?",
        "Est-ce que vous êtes d’accord avec l’existence de la réserve ici ? ",
        "Pensez-vous que ces actions soient globalement efficaces ?",
        "Quel est votre avis sur l’organisme gestionnaire ?",
        "La réserve représente-elle une/des plus-values pour vous ? ",
        "La réserve représente-t-elle des contraintes pour vous ? ",
        "Avec le temps et globalement, est-ce que votre avis sur la réserve a évolué ? "
    ]

    question_labels_short = [
        "Fréquence visites",
        "Animations avis",
        "Règlementation acceptée",
        "Importance",
        "Efficacité",
        "Gestionnaire",
        "Plus-Value",
        "Contraintes",
        "Evolution avis"
    ]

    score_texts = [
        ["Niveau de fréquence",
        "Expression d'un avis",
        "Expression d'un avis",
        "Expression d'un avis",
        "Expression d'un avis",
        "Expression d'un avis",
        "",
        "",
        "Expression d'un avis"
        ],
        ["Jamais", "Aucun avis", "Aucun avis", "Pas du tout d'accord", "Pas du tout efficace",
        "Forte critique", "Plus-value nulle", "Contrainte très forte",
        "Evolution négative des avis"],
        
        ["Moins d'une fois par an", "Avis négatif", "Avis critique", "Plutôt pas d'accord", "Plutôt pas efficace",
        "Quelques éléments critiquables", "Plus-value faible", "Plutôt forte", "x"],
        
        ["1fois/an", "Avis mitigé", "Avis mitigé", "Ne peut pas se positionner", "Ne peut pas se positionner",
        "Neutralité", "Ne sait pas", "Mitigée : contrainte pas complètement acceptée",
        "Pas d'évolution du ressenti"],
        
        ["1fois/trimestre", "Avis positif", "Avis positif", "Plutôt d'accord", "Plutôt efficace",
        "Soutien de principe", "Plus-value  moyenne", "Contrainte acceptée", "x"],
        
        ["1fois/mois", "Avis très enthousiaste", "Avis très enthousiaste", "Tout à fait d'accord", "Très efficace",
        "Fort soutien", "Plus-value forte", "Pas vécu comme une contrainte",
        "Evolution positive du ressenti"]
    ]

    createQuestionsByTheme(THEME_MNEMONIQUE,THEME_LIBELLE,question_labels,question_labels_short,score_texts)

    THEME_MNEMONIQUE = "thème"
    THEME_LIBELLE = "Implication"
    question_labels = [
        "Pouvez-vous citer tous les liens qui existent entre vous et la réserve ? Et pouvez-vous nous en dire plus leur nature ?",
        "Pouvez-vous qualifier globalement l’importance de ces liens ?",
        "Avez-vous l'habitude de participer à des activités / événements / vernissages / animations / points d'observations… organisées par la RN ?",
        "Vous sentez-vous consulté par la RN sur les sujets qui vous concernent ?",
        "Concernant l’équipe de gestion du site, comment se passent vos échanges ? ",
        "Ces échanges ont-ils évolués avec le temps ?"
    ]

    question_labels_short = [
        "Nature des liens",
        "Importance des liens",
        "Participation animations",
        "Impression d'être consulté",
        "Qualité des échanges",
        "Evolution des échanges"
    ]

    score_texts = [
        ["Echelle de ressenti",
        "Qualification des liens",
        "Taux de fréquence aux animations",
        "Echelle de ressenti",
        "Echelle de ressenti",
        "Echelle de ressenti",
        ],
        ["Liens contraints / subis = 'RN nous impose un dialogue / une attitude'", "Aucun lien", "Jamais", "Pas du tout", "Conflit",
        "Evolution négative"],
        
        ["x", "Avis négatif", "Liens faibles", "<1fois/an", "Plutôt non",
        "Aucun échange", "x"],
        
        ["Liens passifs / opportunistes = échanges ou liens lors de visites ou de contrats", "Liens moyens", "1fois/an", "Mitigé", "Echanges à minima",
        "Pas d'évolution"],
        
        ["x", "Liens forts", "1fois/trimestre", "Plutôt oui", "Echanges réguliers et amicaux",
        "x"],
        
        ["Liens forts, guidés par le partage d'une vocation environnementale (recherché par l'acteur)", "Liens d'importance prioritaire", "1fois/mois", "Tout à fait", "Echanges positifs",
        "Evolution positive"]
    ]

    createQuestionsByTheme(THEME_MNEMONIQUE,THEME_LIBELLE,question_labels,question_labels_short,score_texts)