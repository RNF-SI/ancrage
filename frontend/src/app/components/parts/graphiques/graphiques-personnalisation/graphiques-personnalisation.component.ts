import { Component, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AvgPerQuestion } from '@app/interfaces/avg-per-question.interface';
import { Acteur } from '@app/models/acteur.model';
import { NgChartsModule } from 'ng2-charts';
import { Diagnostic } from '@app/models/diagnostic.model';
import { GraphMoy } from '@app/models/graph-moy.model';
import { Nomenclature } from '@app/models/nomenclature.model';
import { Parameters } from '@app/models/parameters.model';
import { Question } from '@app/models/question.model';
import { ActeurService } from '@app/services/acteur.service';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { NomenclatureService } from '@app/services/nomenclature.service';
import { QuestionService } from '@app/services/question.service';
import { Labels } from '@app/utils/labels';
import { forkJoin } from 'rxjs';
import { ChartData, ChartOptions, RadialLinearScaleOptions } from 'chart.js';
import { GraphRepartition } from '@app/models/graph-repartition.model';
import { AlerteTitreComponent } from '@app/components/alertes/alerte-titre/alerte-titre.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '@app/home-rnf/services/auth-service.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-graphiques-personnalisation',
  imports: [
    MatFormFieldModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    ReactiveFormsModule,
    NgChartsModule,
    MatSlideToggleModule
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
  private diagnosticService = inject(DiagnosticService);
  private authService = inject(AuthService);
  id_user = 0;
  diagnostic = input<Diagnostic>(new Diagnostic());
  labels = new Labels();
  chosenActors:Acteur[]=[];
  chosenCategories:Nomenclature[] = [];
  parameters = new Parameters();
  private fb = inject(FormBuilder);
  chartDataByQuestion = signal<AvgPerQuestion[]>([]);
  themeIdToName: { [theme_id: number]: string } = {};
  formGroup = this.fb.group({
    
    questions: this.fb.control<Question[]>([], [Validators.required]),
    acteurs: this.fb.control<Acteur[]>([], [Validators.required]),
    categories: this.fb.control<Nomenclature[]>([], []),  
    diagnostic: [this.diagnostic(),[Validators.required]],
    is_displayed: [false]
  });
  chartDataByThemeSorted = signal<{ theme_id: number; theme: string; charts: AvgPerQuestion[] }[]>([]);
  chartDataRepartition = signal<{ [question: string]: ChartData<'pie'> }>({});
  colorPalette = ['#0072B2', '#E69F00', '#009E73', '#F0E442', '#CC79A7', '#D55E00', '#999999'];
  groupedData = signal<{ [question: string]: GraphRepartition[] }>({});
  radarCharts = signal<{ theme: string; data: ChartData<'radar'> }[]>([]);
  dialog = inject(MatDialog);
  radarChartOptions: ChartOptions<'radar'> = {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: false }
      },
      scales: {
        r: {
          min: 1,
          max: 5,
          beginAtZero: false,
          ticks: {
            stepSize: 1,
            callback: (val: string | number) => val.toString()
          },
          pointLabels: {
            font: {
              size: 14
            }
          }
        } as unknown as RadialLinearScaleOptions
      }
    };

  constructor(){
    effect(() => {

      forkJoin({
        cats$: this.nomenclatureService.getAllByType("categorie"),
        acteurs$: this.acteurService.getAllByDiag(this.diagnostic().id_diagnostic),
        questions$: this.questionService.getAll()
      }).subscribe(({ cats$, acteurs$,questions$ }) => {
        this.nomenclatureService.sortByOrder(cats$);
        this.categories.set(cats$);
        this.acteurService.sortByNameAndSelected(this.acteurs());
        this.acteurs.set(acteurs$);
        this.questions.set(questions$);
      });

    });

    effect(() =>{
   
      this.formGroup.get('categories')?.valueChanges.subscribe(selectedCategories => {
        
        if (!selectedCategories) return;
    
        // on suppose que chaque catégorie a un id_nomenclature
        const selectedCategoryIds = selectedCategories.map((c: Nomenclature) => c.id_nomenclature);
    
        // filtre les acteurs dont la catégorie est incluse
        const matchedActeurs = this.acteurs().filter(act =>
          act.categories?.some(cat => selectedCategoryIds.includes(cat.id_nomenclature))
        );
       
        // met à jour le formControl des acteurs
        this.formGroup.get('acteurs')?.setValue(matchedActeurs);
      });
    });

    effect(() =>{
   
      this.id_user = this.authService.getCurrentUser().id_role;
  
    });
  }

  sendParameters(event: Event){
      event.preventDefault();
        
      this.parameters = Object.assign(new Parameters(),this.formGroup.value);
      this.parameters.diagnostic = this.diagnostic();
      forkJoin({
        graphs$: this.diagnosticService.getAverageByQuestionParams(this.parameters),
        repartitions$: this.diagnosticService.getRepartitionParams(this.parameters)
       
      }).subscribe(({ graphs$, repartitions$}) => {
        this.getCharts(graphs$,repartitions$);
      });

      
  }

  private getCharts(graphs:GraphMoy[],repartitions:GraphRepartition[]): void {
      const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/’/g, "'").trim();
      const LABELS_TO_EXCLUDE = ["attentes", "Sentiment d'être concerné"].map(normalize);

        const grouped = new Map<string, GraphMoy[]>();
        for (const entry of graphs) {
          const label = normalize(entry.question ?? '');
          if (!LABELS_TO_EXCLUDE.includes(label)) {
            if (!grouped.has(entry.question)) grouped.set(entry.question, []);
            grouped.get(entry.question)!.push(entry);
          }
        }
        const avgData = Array.from(grouped.entries()).map(([question, data]) => {
          const sorted = data.sort((a, b) => a.categorie.localeCompare(b.categorie));
          const theme_id = sorted[0]?.theme_id || 0;
          const theme = sorted[0]?.theme || 'Autres';
          this.themeIdToName[theme_id] = theme;
          return {
            id_question: sorted[0]?.id_question,
            question,
            theme_id,
            chart: {
              labels: sorted.map(d => d.categorie),
              datasets: [{ label: 'Score moyen', data: sorted.map(d => d.moyenne), backgroundColor: '#4CAF50' }]
            },
            chartOptions: {
              responsive: true,
              scales: {
                y: { beginAtZero: true, min: 1, max: 5, ticks: { stepSize: 1 } }
              }
            }
          } satisfies AvgPerQuestion;
        });
        this.chartDataByQuestion.set(avgData);
  
        const themeSorted = Object.entries(this.themeIdToName).map(([id, name]) => ({
          theme_id: +id,
          theme: name,
          charts: avgData.filter(a => a.theme_id === +id)
        })).sort((a, b) => a.theme_id - b.theme_id);
        this.chartDataByThemeSorted.set(themeSorted);
  
        const repartitionGrouped: { [q: string]: GraphRepartition[] } = {};
        for (const r of repartitions) {
          if (!repartitionGrouped[r.question]) repartitionGrouped[r.question] = [];
          repartitionGrouped[r.question].push(r);
        }
        this.groupedData.set(repartitionGrouped);
  
        const chartRepartition: { [question: string]: ChartData<'pie'> } = {};

        for (const question in repartitionGrouped) {
          const responses = repartitionGrouped[question]
            .filter(r => !LABELS_TO_EXCLUDE.includes(normalize(r.reponse || '')));
          
          const labels = responses.map(r => r.reponse);
          const data = responses.map(r => r.nombre);

          // couleur basée sur le score
          const backgroundColors = responses.map(r => this.colorPalette[r.score]);

          chartRepartition[question] = { 
            labels, 
            datasets: [{ data, backgroundColor: backgroundColors }] 
          };
        }

        this.chartDataRepartition.set(chartRepartition);
  
        
    }

    exportChart(classe:string,titre:string) {
      const canvas = document.querySelector("."+ classe) as HTMLCanvasElement;
      const image = canvas.toDataURL('image/png');
      const dialogRef = this.dialog.open(AlerteTitreComponent);
      dialogRef.afterClosed().subscribe(titreGraph=>{
        
        const link = document.createElement('a');
        link.href = image;
        link.download = titre+'-'+titreGraph+'.png';
        link.click();
      });
    
      // Création du lien pour téléchargement
      
    }

    getChartData(question: string): ChartData<'pie'> {
 
      return this.chartDataRepartition()[question];
    }

    reinitialize(){
      this.formGroup.get('categories')?.setValue([]);
      this.formGroup.get('acteurs')?.setValue([]);
      this.formGroup.get('questions')?.setValue([]);
    }

}
