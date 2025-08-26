import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Acteur } from '@app/models/acteur.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { Question } from '@app/models/question.model';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { QuestionService } from '@app/services/question.service';
import { Labels } from '@app/utils/labels';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-tableau-export',
  imports: [CommonModule,MatButtonModule],
  templateUrl: './tableau-export.component.html',
  styleUrl: './tableau-export.component.css'
})
export class TableauExportComponent {

  acteurs = input<Acteur[]>([]);
  diagnostic = input<Diagnostic>(new Diagnostic());
  categories = signal<Nomenclature[]>([]);
  questions = signal<Question[]>([]);
  private nomenclatureService = inject(NomenclatureService);
  private questionService = inject(QuestionService)
  labels = new Labels();
 
  constructor(){
    effect(() => {

      forkJoin({
        cats$: this.nomenclatureService.getAllByType("categorie"),
        questions$: this.questionService.getAll(),
      }).subscribe(({ cats$, questions$ }) => {
        this.nomenclatureService.sortByOrder(cats$);
        this.categories.set(cats$);
        this.questions.set(questions$);
        
      });

    });
  }

  getReponse(act: Acteur, id_question: number): number {
    const rep = act.reponses?.find(r => r.question?.id_question === id_question);
    return rep ? rep.valeur_reponse.value : 0;
  }

  getCategory(act: Acteur, id_nomenclature: number){
    const acteur = act.categories?.some(cate => cate.id_nomenclature === id_nomenclature) ? 1: 0
    return acteur;
  }

  exportCsv() {
    console.log(this.acteurs());
    const rows: string[][] = [];
  
    // ---- Ligne d’en-tête ----
    const header = [
      ...this.categories().map(c => `groupe${c.ordre}`),
      ...this.questions().map(q => `metrique${q.metrique}`)
    ];
    rows.push(header);
  
    // ---- Lignes pour chaque acteur ----
    for (const act of this.acteurs()) {
      const row: string[] = [];
  
      // Colonnes catégories (0/1)
      for (const cat of this.categories()) {
        const hasCat = act.categories?.some(
          (cate: any) => cate.id_nomenclature === cat.id_nomenclature
        );
        row.push(hasCat ? '1' : '0');
      }
  
      // Colonnes questions (valeurs ou vide)
      for (const q of this.questions()) {
        const rep = act.reponses?.find(
          (r: any) => r.question?.id_question === q.id_question
        );
        row.push(rep ? String(rep.valeur_reponse.value) : '0');
      }
  
      rows.push(row);
    }
  
    // ---- Conversion en CSV ----
    const csvContent = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  
    // ---- Téléchargement ----
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export-'+this.diagnostic().nom+'.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

}


