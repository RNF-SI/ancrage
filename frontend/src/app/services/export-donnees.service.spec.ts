import { TestBed } from '@angular/core/testing';

import { ExportDonneesService } from './export-donnees.service';
import { Acteur } from '@app/models/acteur.model';
import { MotCle } from '@app/models/mot-cle.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { Question } from '@app/models/question.model';
import { Reponse } from '@app/models/reponse.model';

function nomenclature(id: number, libelle: string, value = 0): Nomenclature {
  const nom = new Nomenclature();
  nom.id_nomenclature = id;
  nom.libelle = libelle;
  nom.value = value;
  return nom;
}

function question(id: number, libelle_graphique: string, metrique: number): Question {
  const q = new Question();
  q.id_question = id;
  q.libelle_graphique = libelle_graphique;
  q.metrique = metrique;
  return q;
}

function reponse(q: Question, valeur?: Nomenclature, commentaires = ''): Reponse {
  const r = new Reponse();
  r.question = q;
  r.commentaires = commentaires;
  if (valeur) r.valeur_reponse = valeur;
  return r;
}

describe('ExportDonneesService', () => {
  let service: ExportDonneesService;

  const categoriePartenaires = nomenclature(11, 'Partenaires, gestionnaires et techniciens');
  const categorieRiverains = nomenclature(12, 'Riverains, élus et usagers locaux');

  // Une question du début du questionnaire et une des dernières (métrique > 25),
  // celles qui étaient tronquées de l'export.
  const q1 = question(1, 'Connaissance des missions', 1);
  const q34 = question(34, 'Attentes', 34);

  const questions = [q1, q34];
  const categories = [categoriePartenaires, categorieRiverains];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExportDonneesService);
  });

  it('devrait être créé', () => {
    expect(service).toBeTruthy();
  });

  describe('construireMatrice', () => {
    it("place une colonne par catégorie puis une par question dans l'en-tête", () => {
      const lignes = service.construireMatrice([], categories, questions);

      expect(lignes[0]).toEqual([
        'Individu',
        'Partenaires, gestionnaires et techniciens',
        'Riverains, élus et usagers locaux',
        'Connaissance des missions',
        'Attentes',
      ]);
    });

    it('anonymise les acteurs et code leur appartenance aux catégories en 0/1', () => {
      const acteur = new Acteur();
      acteur.categories = [categorieRiverains];
      acteur.reponses = [];

      const lignes = service.construireMatrice([acteur], categories, questions);

      expect(lignes[1][0]).toBe('acteur1');
      expect(lignes[1][1]).toBe(0);
      expect(lignes[1][2]).toBe(1);
    });

    it('exporte le score des réponses, y compris pour les questions de métrique supérieure à 25', () => {
      const acteur = new Acteur();
      acteur.categories = [];
      acteur.reponses = [
        reponse(q1, nomenclature(60, 'Méconnaissance', 1)),
        reponse(q34, nomenclature(75, 'Fortes attentes', 5)),
      ];

      const lignes = service.construireMatrice([acteur], categories, questions);

      expect(lignes[1][3]).toBe(1);
      expect(lignes[1][4]).toBe(5);
    });

    it('laisse la cellule vide quand la question est sans réponse, sans écrire « NULL »', () => {
      const acteur = new Acteur();
      acteur.categories = [];
      acteur.reponses = [reponse(q1, nomenclature(60, 'Méconnaissance', 1))];

      const lignes = service.construireMatrice([acteur], categories, questions);

      expect(lignes[1][4]).toBe('');
      expect(lignes[1]).not.toContain('NULL');
    });

    it('numérote les acteurs dans l’ordre reçu', () => {
      const premier = new Acteur();
      premier.categories = [];
      const second = new Acteur();
      second.categories = [];

      const lignes = service.construireMatrice([premier, second], categories, questions);

      expect(lignes.length).toBe(3);
      expect(lignes[1][0]).toBe('acteur1');
      expect(lignes[2][0]).toBe('acteur2');
    });
  });

  describe('construireExportComplet', () => {
    it('ajoute une colonne de commentaire par question et les quatre colonnes AFOM', () => {
      const entete = service.construireExportComplet([], questions)[0];

      expect(entete).toContain('Connaissance des missions');
      expect(entete).toContain('Connaissance des missions - Commentaire');
      expect(entete).toContain('Attentes');
      expect(entete).toContain('Attentes - Commentaire');
      expect(entete.slice(-4)).toEqual(['Atouts', 'Faiblesses', 'Opportunités', 'Menaces']);
    });

    it('exporte le libellé de la réponse et son commentaire', () => {
      const acteur = new Acteur();
      acteur.categories = [categoriePartenaires];
      acteur.reponses = [
        reponse(q1, nomenclature(60, 'Méconnaissance', 1), '  entretien écourté  '),
      ];

      const [entete, ligne] = service.construireExportComplet([acteur], questions);

      expect(ligne[entete.indexOf('Connaissance des missions')]).toBe('Méconnaissance');
      expect(ligne[entete.indexOf('Connaissance des missions - Commentaire')]).toBe('entretien écourté');
      expect(ligne[entete.indexOf('categories')]).toBe('Partenaires, gestionnaires et techniciens');
    });

    it('remplace un mot-clé de groupe par les mots-clés qui lui sont rattachés', () => {
      const groupe = new MotCle();
      groupe.nom = 'Paysage';
      groupe.categorie = nomenclature(21, 'Atouts');
      const enfant = new MotCle();
      enfant.nom = 'Panoramas';
      groupe.mots_cles_issus = [enfant];

      const isole = new MotCle();
      isole.nom = 'Fréquentation';
      isole.categorie = nomenclature(22, 'Menaces');

      const rattache = new MotCle();
      rattache.nom = 'Panoramas';
      rattache.categorie = nomenclature(21, 'Atouts');
      rattache.mot_cle_id_groupe = 1;

      const acteur = new Acteur();
      acteur.categories = [];
      acteur.mots_cles_afom = [groupe, isole, rattache];

      const [entete, ligne] = service.construireExportComplet([acteur], questions);

      expect(ligne[entete.indexOf('Atouts')]).toBe('Panoramas');
      expect(ligne[entete.indexOf('Menaces')]).toBe('Fréquentation');
    });
  });
});
