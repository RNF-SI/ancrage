import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

import { Acteur } from '@app/models/acteur.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { Question } from '@app/models/question.model';

/**
 * Construction des classeurs Excel exportés depuis la visualisation d'un diagnostic.
 *
 * Les méthodes de construction sont pures (elles renvoient un tableau de lignes)
 * afin de rester vérifiables par les tests, le téléchargement étant isolé dans
 * `telecharger`.
 */
@Injectable({ providedIn: 'root' })
export class ExportDonneesService {

  /** Catégories AFOM, dans l'ordre attendu dans les colonnes de l'export complet. */
  readonly categoriesAfom = ['Atouts', 'Faiblesses', 'Opportunités', 'Menaces'];

  /** Largeur par défaut des colonnes, pour que les en-têtes restent lisibles. */
  private readonly largeurColonne = 28;

  /**
   * Matrice anonymisée : une ligne par acteur, une colonne par catégorie
   * (présence 0/1) puis une colonne par question (score de la réponse).
   * Une question sans réponse laisse la cellule vide, afin que la colonne
   * reste numérique et exploitable par un outil d'analyse.
   */
  construireMatrice(acteurs: Acteur[], categories: Nomenclature[], questions: Question[]): any[][] {
    const lignes: any[][] = [];

    lignes.push([
      'Individu',
      ...categories.map(c => c.libelle),
      ...questions.map(q => q.libelle_graphique),
    ]);

    acteurs.forEach((acteur, index) => {
      lignes.push([
        `acteur${index + 1}`,
        ...categories.map(c => this.appartientCategorie(acteur, c.id_nomenclature)),
        ...questions.map(q => this.scoreReponse(acteur, q.id_question)),
      ]);
    });

    return lignes;
  }

  /**
   * Export complet et nominatif : identité de l'acteur, libellé et commentaire
   * de chaque réponse, puis les mots-clés AFOM regroupés par catégorie.
   */
  construireExportComplet(acteurs: Acteur[], questions: Question[]): any[][] {
    const lignes: any[][] = [];

    lignes.push([
      'id_acteur',
      'nom',
      'prenom',
      'fonction',
      'structure',
      'mail',
      'telephone',
      'profil',
      'commune',
      'categories',
      'statut_entretien',
      ...questions.flatMap(q => [q.libelle_graphique, `${q.libelle_graphique} - Commentaire`]),
      ...this.categoriesAfom,
    ]);

    acteurs.forEach(acteur => {
      lignes.push([
        acteur.id_acteur,
        acteur.nom,
        acteur.prenom,
        acteur.fonction,
        acteur.structure,
        acteur.mail,
        acteur.telephone,
        acteur.profil?.libelle || '',
        acteur.commune?.nom_com || '',
        (acteur.categories || []).map(c => c.libelle).join(', '),
        acteur.statut_entretien?.libelle || '',
        ...questions.flatMap(q => [
          this.libelleReponse(acteur, q.id_question),
          this.commentaireReponse(acteur, q.id_question),
        ]),
        ...this.categoriesAfom.map(cat => this.motsClesAfom(acteur, cat)),
      ]);
    });

    return lignes;
  }

  /** Écrit les lignes dans un classeur Excel et déclenche le téléchargement. */
  telecharger(lignes: any[][], nomFeuille: string, nomFichier: string): void {
    const feuille = XLSX.utils.aoa_to_sheet(lignes);
    feuille['!cols'] = (lignes[0] || []).map(() => ({ wch: this.largeurColonne }));

    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, nomFeuille);

    const contenu = XLSX.write(classeur, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([contenu], { type: 'application/octet-stream' }), nomFichier);
  }

  /** 1 si l'acteur appartient à la catégorie, 0 sinon. */
  private appartientCategorie(acteur: Acteur, id_nomenclature: number): number {
    return acteur.categories?.some(c => c.id_nomenclature === id_nomenclature) ? 1 : 0;
  }

  /** Score de la réponse, ou cellule vide si l'acteur n'a pas répondu. */
  private scoreReponse(acteur: Acteur, id_question: number): number | string {
    const reponse = this.reponse(acteur, id_question);
    if (!reponse?.valeur_reponse?.id_nomenclature) return '';
    return reponse.valeur_reponse.value;
  }

  private libelleReponse(acteur: Acteur, id_question: number): string {
    const reponse = this.reponse(acteur, id_question);
    if (!reponse?.valeur_reponse?.id_nomenclature) return '';
    return reponse.valeur_reponse.libelle || '';
  }

  private commentaireReponse(acteur: Acteur, id_question: number): string {
    return this.reponse(acteur, id_question)?.commentaires?.trim() || '';
  }

  private reponse(acteur: Acteur, id_question: number) {
    return acteur.reponses?.find(r => r.question?.id_question === id_question);
  }

  /**
   * Mots-clés AFOM d'une catégorie : on ne garde que les mots-clés de groupe et
   * on les remplace par les mots-clés qui leur ont été rattachés quand il y en a.
   */
  private motsClesAfom(acteur: Acteur, libelleCategorie: string): string {
    const valeurs = new Set<string>();

    for (const motCle of acteur.mots_cles_afom ?? []) {
      if (motCle.mot_cle_id_groupe) continue;
      if (motCle.categorie?.libelle !== libelleCategorie) continue;

      if (motCle.mots_cles_issus?.length) {
        for (const enfant of motCle.mots_cles_issus) {
          if (enfant.nom?.trim()) valeurs.add(enfant.nom.trim());
        }
      } else if (motCle.nom?.trim()) {
        valeurs.add(motCle.nom.trim());
      }
    }

    return Array.from(valeurs).join('; ');
  }
}
