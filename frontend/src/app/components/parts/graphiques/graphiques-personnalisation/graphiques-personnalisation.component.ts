import { Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Acteur } from '@app/models/acteur.model';
import { Departement } from '@app/models/departement.model';
import { Diagnostic } from '@app/models/diagnostic.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { Parameters } from '@app/models/parameters.model';
import { Question } from '@app/models/question.model';
import { ActeurService } from '@app/services/acteur.service';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { QuestionService } from '@app/services/question.service';
import { Labels } from '@app/utils/labels';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-graphiques-personnalisation',
  imports: [
    MatFormFieldModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  templateUrl: './graphiques-personnalisation.component.html',
  styleUrl: './graphiques-personnalisation.component.css'
})
export class GraphiquesPersonnalisationComponent {
  acteurs = signal<Acteur[]>([]);
  categories = signal<Nomenclature[]>([]);
  questions = signal<Question[]>([]);
  modes = ['bar','radar','pie'];
  private acteurService = inject(ActeurService);
  private nomenclatureService = inject(NomenclatureService);
  private questionService = inject(QuestionService);
  diagnostic = input<Diagnostic>(new Diagnostic());
  labels = new Labels();
  chosenActors:Acteur[]=[];
  chosenCategories:Nomenclature[] = [];
  parameters = new Parameters();
  private fb = inject(FormBuilder);
  formGroup = this.fb.group({
    
    questions: this.fb.control<Question[]>([], [Validators.required]),
    acteurs: this.fb.control<Acteur[]>([], [Validators.required]),
    categories: this.fb.control<Nomenclature[]>([], []),  
    mode :['', [Validators.required]],
    
  });

  constructor(){
    effect(() => {

      forkJoin({
        cats$: this.nomenclatureService.getAllByType("categorie"),
        acteurs$: this.acteurService.getAllByDiag(this.diagnostic().id_diagnostic),
        questions$: this.questionService.getAll()
      }).subscribe(({ cats$, acteurs$,questions$ }) => {
        this.nomenclatureService.sortByOrder(cats$);
        this.categories.set(cats$);
        this.acteurService.sortByNameAndSelected(this.acteurs())
        this.acteurs.set(acteurs$);
        this.questions.set(questions$);
      });

    });
  }

  sendParameters(event: Event){
      event.preventDefault();
        
      this.parameters = Object.assign(new Parameters(),this.formGroup.value);
      console.log(this.parameters);
  }
}
