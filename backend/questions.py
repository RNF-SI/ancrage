from app import create_app, db
from models.models import Question, Reponse, Nomenclature

app = create_app()

def createQuestionsByTheme(THEME_MNEMONIQUE, THEME_LIBELLE, question_labels, question_labels_short, score_texts):
    theme = Nomenclature(libelle=THEME_LIBELLE, mnemonique=THEME_MNEMONIQUE)
    db.session.add(theme)
    db.session.commit()

    sans_reponse_key = ("Sans réponse", 0)
    existing_nomenclatures = {
        (n.libelle.strip(), n.value): n
        for n in Nomenclature.query.filter_by(mnemonique="reponse_score").all()
    }

    if sans_reponse_key not in existing_nomenclatures:
        sans_reponse_nomenclature = Nomenclature(libelle="Sans réponse", value=0, mnemonique="reponse_score")
        db.session.add(sans_reponse_nomenclature)
        db.session.flush()
        existing_nomenclatures[sans_reponse_key] = sans_reponse_nomenclature
    else:
        sans_reponse_nomenclature = existing_nomenclatures[sans_reponse_key]

    ne_se_prononce_pas_key = ("N'a pas exprimé de réponse claire", 3)
    if ne_se_prononce_pas_key not in existing_nomenclatures:
        nsp_nomenclature = Nomenclature(libelle="N'a pas exprimé de réponse claire", value=3, mnemonique="reponse_score")
        db.session.add(nsp_nomenclature)
        db.session.flush()
        existing_nomenclatures[ne_se_prononce_pas_key] = nsp_nomenclature
    else:
        nsp_nomenclature = existing_nomenclatures[ne_se_prononce_pas_key]

    for col_idx, (label, sht) in enumerate(zip(question_labels, question_labels_short)):
        indications = score_texts[0][col_idx] if score_texts and len(score_texts[0]) > col_idx else ""

        # Création de la question
        question = Question(
            libelle=label,
            theme=theme,
            indications=indications,
            libelle_graphique=sht
        )
        db.session.add(question)
        db.session.flush()

        # Ajout de "Sans réponse" à chaque question
        question.choixReponses.append(sans_reponse_nomenclature)
        question.choixReponses.append(nsp_nomenclature)
        # Ajout des réponses possibles (scores 1 à 5)
        if score_texts:
            for score_offset, score in enumerate(range(1, 6)):
                try:
                    text = score_texts[score_offset + 1][col_idx].strip()
                except IndexError:
                    continue

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

                # Ajoute la nomenclature comme choix possible pour la question
                question.choixReponses.append(nom)

                # Crée une entrée Reponse "vierge", sans acteur, pour initialiser
                reponse = Reponse(
                    question_id=question.id_question,
                    valeur_reponse_id=nom.id_nomenclature
                )
                db.session.add(reponse)

    db.session.commit()
    print("✅ Questions, choix de réponses et liaisons enregistrés avec succès.")

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
        "Les informations dont vous avez besoin sur ce site sont-elles accessibles ?"
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
        "Non connue", "Faux ou non connues", "Ne connaît aucun des documents qui lui sont destinés",
        "Faux ou non réponse", "Non"],
  
        ["1 mission", "1", "x", "x", "Localisation peu assurée",
        "x", "x", "x", "x", "x"],
    
        ["//si 2 bonnes réponses et 1 réponse fausse//", "2", "moins de 50 %", "Incomplet", "Localisation globalement correcte",
        "Connaissance floue", "Des espèces mais pas celles attendues / sans caractère patrimonial", "Connaît approximativement la documentation",
        "Contact peu précis ou peu adéquat (réponse floue)", "Peu accessible"],
    
        ["2 missions claires", "3", "x", "x", "Bon tracé, quelques approximations peu problématiques",
        "x", "x", "x", "x", "x"],

        ["3 missions", "4 ou 5", "plus de 50% des animations connues", "Complet", "Périmètre exact",
        "Principales réglementations", "Espèce(s) avec un intérêt patrimonial ou mise(s) en avant par les gestionnaires", "Connaît tous les documents qui lui sont destinés",
        "Nom précis d’une personne ressource compétente ou responsable du site ", "Facilement accessible"]
    ]

    createQuestionsByTheme(THEME_MNEMONIQUE,THEME_LIBELLE,question_labels,question_labels_short,score_texts)

    THEME_MNEMONIQUE = "thème"
    THEME_LIBELLE = "Intérêt"
    question_labels = [
        "A quelle fréquence venez-vous voir le site pour des raisons professionnelles ou de loisirs ?",
        "Quel est votre avis sur les animations ?",
        "Quel est votre avis sur la réglementation ?",
        "Est-ce que vous êtes d’accord avec l’existence du site ici ? ",
        "Pensez-vous que ces actions soient globalement efficaces ?",
        "Quel est votre avis sur l’organisme gestionnaire ?",
        "Le site représente-il une/des plus-values pour vous ? ",
        "Le site représente-t-il des contraintes pour vous ? ",
        "Avec le temps et globalement, est-ce que votre avis sur le site a évolué ? "
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
        "Pouvez-vous citer tous les liens qui existent entre vous et le site ? Et pouvez-vous nous en dire plus leur nature ?",
        "Pouvez-vous qualifier globalement l’importance de ces liens ?",
        "Avez-vous l'habitude de participer à des activités / événements / vernissages / animations / points d'observations… organisées par le site ?",
        "Vous sentez-vous consulté par le site sur les sujets qui vous concernent ?",
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

        ["Liens contraints / subis = 'le site nous impose un dialogue / une attitude'",
          "Aucun lien", 
          "Jamais", 
          "Pas du tout", 
          "Conflit",
        "Evolution négative"],
        
        ["x", 
         "Liens faibles", 
         "<1fois/an", 
         "Plutôt non",
        "Aucun échange", 
        "x"],
        
        ["Liens passifs / opportunistes = échanges ou liens lors de visites ou de contrats", 
         "Liens moyens",
           "1fois/an",
             "Mitigé",
               "Echanges à minima",
        "Pas d'évolution"],
        
        ["x", 
         " liens recherchés par l’acteur", 
         "1fois/trimestre",
           "Plutôt oui",
           "Echanges réguliers et amicaux",
        "x"],
        
        ["Liens forts, guidés par le partage d'une vocation environnementale (recherché par l'acteur)", "Liens d'importance prioritaire", "1fois/mois", "Tout à fait", "Echanges positifs",
        "Evolution positive"]
    ]

    createQuestionsByTheme(THEME_MNEMONIQUE,THEME_LIBELLE,question_labels,question_labels_short,score_texts)

    THEME_MNEMONIQUE = "thème"
    THEME_LIBELLE = "CCG"
    question_labels = [
        "En tant que membre du CCG, avez-vous l'impression d'être impliqué dans la vie du site ?",
        "Que pensez-vous du CCG, en tant qu’instance de discussion ?",
        "Lors du CCG, faites-vous des interventions régulièrement (questions, prises de positions) ?",
        "Quelle est la fréquence de votre participation au CCG ?"
    ]

    question_labels_short = [
        "Sentiment d'implication",
        "Ressenti d'intérêt",
        "Fréquence d'interventions",
        "Fréquence de participation"
    ]

    score_texts = [
        ["Echelle de ressenti",
        "Echelle de ressenti",
        "Echelle de ressenti",
        "Echelle de ressenti"
        ],

        ["Pas du tout", "Non intérêt", "Jamais", "Jamais"],
        
        ["Plutôt non", "Criticable", "Rarement", "1x sur les 5 dernières années"],
        
        ["Mitigé", "Pas d'avis", "De temps en temps", "2x sur les 5 dernières années"],
        
        ["Plutôt oui", "Correct", "La plupart du temps", "3x sur les 5 dernières années"],
        
        ["Tout à fait", "Efficace et légitime", "Toujours", "4x ou > sur les 5 dernières années"]
    ]

    createQuestionsByTheme(THEME_MNEMONIQUE,THEME_LIBELLE,question_labels,question_labels_short,score_texts)

    THEME_MNEMONIQUE = "thème"
    THEME_LIBELLE = "Climat"
    question_labels = [
        "Que connaissez-vous des impacts du changement climatique sur le territoire ? ",
        "Êtes vous concernés par ces changements, si oui à quels degrès ? Comment y réagissez vous ?",
        "Pensez-vous que le site s'adapte à ces changements, si oui comment ? ",
        "Que pensez-vous de ces choix d'adaptation ? Pourquoi ?"
    ]

    question_labels_short = [
        "Impacts",
        "Sentiment d'être concerné",
        "Adaptation",
        "Avis"
    ]

    score_texts = [
         
        ["Champs à identifier",
         "Sans indicateur",
         "Champs à identifier",
         "Echelle de ressenti"
        ],

        ["Aucune connaissance",
        "x",
        "Aucune connaissance",
        "Pas du tout"
        ],
        ["x", "x", "x", "Plutôt non"],
        
        ["Approximatif", "x", "Approximatif", "Mitigé"],
        
        ["x", "x", "x", "Plutôt oui"],
        
        ["Solide", "x", "Solide", "Tout à fait"],

        
        
    ]

    createQuestionsByTheme(THEME_MNEMONIQUE,THEME_LIBELLE,question_labels,question_labels_short,score_texts)

    THEME_MNEMONIQUE = "thème"
    THEME_LIBELLE = "Conclusion"
    question_labels = [
        "Avez-vous des attentes particulières par rapport au site ? ",
        "Pour faire la synthèse de tous les points abordés précédemment, le site apporte-t-il dans l’ensemble plutôt des bénéfices ou des inconvénients sur ce territoire ?",
        "Selon vous, le site est-il bien enraciné sur le territoire ? Pourquoi ? "
    ]

    question_labels_short = [
        "Attentes",
        "Synthèse",
        "Enracinement"
    ]

    score_texts = [
         
        ["Sans indicateur",
         "",
         ""
        ],

        ["x",
        "Seulement des inconvénients",
        "Pas du tout"
        ],
        ["x", "Plus d'inconvénients", "Plutôt non"],
        
        ["x", "Equilibré ou ne sait pas", "Mitigé"],
        
        ["x", "Plus de bénéfices", "Plutôt oui"],
        
        ["x", "Seulement des bénéfices", "Tout à fait"],

    ]

    createQuestionsByTheme(THEME_MNEMONIQUE,THEME_LIBELLE,question_labels,question_labels_short,score_texts)

    THEME_MNEMONIQUE = "thème"
    THEME_LIBELLE = "AFOM"
    question_labels = [
        "Atouts - Faiblesses - Opportunités - Menaces"

    ]

    question_labels_short = ["afom"]

    
    createQuestionsByTheme(THEME_MNEMONIQUE,THEME_LIBELLE,question_labels,question_labels_short,None)

    
    updates = [
        # Bloc 1
        (1, 1, 10), (2, 2, 10), (4, 3, 10), (5, 4, 10), (6, 5, 10), (7, 7, 10), (13, 6, 10),
        # Bloc 2
        (8, 8, 11), (9, 9, 11), (10, 10, 11),
        # Bloc 3
        (20, 20, 16),
        # Bloc 4
        (3, 12, 13), (12, 13, 13), (15, 14, 13),
        # Bloc 5
        (16, 15, 14),
        # Bloc 6
        (22, 22, 16), (23, 23, 16), (26, 26, 17), (32, 32, 18),
        # Bloc 7
        (34, 34, 19), (21, 21, 16), (36, 36, 19), (24, 24, 16), (25, 25, 16), (27, 27, 16),
        # Bloc 8
        (28, 28, 17), (29, 29, 17), (30, 30, 18), (31, 31, 18),
        # Bloc 9
        (33, 33, 18), (35, 35, 19), (11, 11, 12), (14, 16, 15),
        # Bloc 10
        (17, 17, 15), (18, 18, 15), (19, 19, 15)
    ]

    for id_question, ordre, theme_question_id in updates:
        question = db.session.get(Question, id_question)
        if question:
            question.ordre = ordre
            question.metrique = id_question  
            question.theme_question_id = theme_question_id
        else:
            print(f"Question ID {id_question} non trouvée.")

    db.session.commit()