import { Component, inject, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { Diagnostic } from '@app/models/diagnostic.model';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { GraphMoy } from '@app/models/graph-moy.model';
import { forkJoin, Subscription } from 'rxjs';
import { AvgPerQuestion } from '@app/interfaces/avg-per-question.interface';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ActivatedRoute } from '@angular/router';
import { Chart, ChartConfiguration, ChartData, ChartOptions, RadialLinearScaleOptions } from 'chart.js';
import { GraphRepartition } from '@app/models/graph-repartition.model';
import { MatButtonModule } from '@angular/material/button';
import { Labels } from '@app/utils/labels';
import { GraphRadar } from '@app/models/graph-radar.model';
import { GraphMotsCles } from '@app/models/graph-mots-cles';

//COmposant pour visualiser les graphiques
interface ReponseRep {
  theme: string;
  question: string;
  reponse: string;
  nombre: number;
  valeur: string;
}

@Component({
  selector: 'app-graphiques',
  templateUrl: './graphiques.component.html',
  styleUrls: ['./graphiques.component.css'],
  standalone:true,
  imports:[CommonModule,MatTabsModule,NgChartsModule,MatButtonModule]
})

export class GraphiquesComponent implements OnDestroy{
 
  @Input() diagnostic = new Diagnostic();
  @Input() route = inject(ActivatedRoute);
  chartDataByQuestion?:AvgPerQuestion[];
  private diagnosticService = inject(DiagnosticService);
  private diagnosticSubscription?:Subscription;
  private routeSubscription?:Subscription;
  groupedData: { [question: string]: GraphRepartition[] } = {};
  chartDataByTheme: { [theme_id: number]: AvgPerQuestion[] } = {};
  labels = new Labels();
  radarCharts: {
    theme: string;
    data: ChartData<'radar'>;
  }[] = [];
  chartDataRepartition: { [question: string]: ChartData<'pie'> } = {};
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
  themeIdToName: { [theme_id: number]: string } = {};
  chartDataByThemeSorted: {
    theme_id: number;
    theme: string;
    charts: AvgPerQuestion[];
  }[] = [];
  @Input() data: GraphMotsCles[] = [];

  groupedCharts: {
    categorie: string;
    chartData: ChartConfiguration<'bar'>;
  }[] = [];


  ngOnChanges(changes: SimpleChanges): void {
      if (changes['diagnostic']) {
        this.getCharts();
      }
  }

  //Récupère les données
  getCharts(){
    let id_diagnostic = this.diagnostic.id_diagnostic;
    const moyennes$ = this.diagnosticService.getAverageByQuestion(id_diagnostic);
    const repartitions$ = this.diagnosticService.getRepartition(id_diagnostic);
    const radars$ = this.diagnosticService.getRadars(id_diagnostic);
    const motsCles$ = this.diagnosticService.getOccurencesKeyWords(id_diagnostic);
    const LABELS_TO_EXCLUDE = ['attentes', "Sentiment d'être concerné"];
    this.diagnosticSubscription = forkJoin([moyennes$,repartitions$,radars$,motsCles$]).subscribe(([graphs,repartitions,radars,motsCles]) => {
      const grouped = new Map<string, GraphMoy[]>();
      for (const entry of graphs) {
        if (LABELS_TO_EXCLUDE.includes(entry.question?.toLowerCase())) continue;
        if (!grouped.has(entry.question)) {
          grouped.set(entry.question, []);
        }
        
        grouped.get(entry.question)?.push(entry);
      }
     
      const groupedRepartition: { [question: string]: GraphRepartition[] } = {};
      for (const rep of repartitions) {
        if (!groupedRepartition[rep.question]) {
          groupedRepartition[rep.question] = [];
        }
        groupedRepartition[rep.question].push(rep);
      }
      this.groupedData = groupedRepartition;
      this.chartDataRepartition = {}; // reset
      for (const question in this.groupedData) {
        const responses = this.groupedData[question].filter(
          r => !LABELS_TO_EXCLUDE.includes(r.reponse?.toLowerCase())
        );
        this.chartDataRepartition[question] = {
          labels: responses.map(r => r.reponse),
          datasets: [{
            data: responses.map(r => r.nombre),
          }]
        };
      }
      this.chartDataByQuestion = Array.from(grouped.entries()).map(([question, data]) => {
        const sorted = [...data].sort((a, b) => a.categorie.localeCompare(b.categorie));
        const id_question = sorted[0]?.id_question;
        const theme = sorted[0]?.theme || "Autres";
        const theme_id = sorted[0]?.theme_id || 0;
      
        this.themeIdToName[theme_id] = theme;
        const chartData: AvgPerQuestion = {
          id_question,
          question,
          theme_id,
          chart: {
            labels: sorted.map(d => d.categorie),
            datasets: [{
              label: 'Score moyen',
              data: sorted.map(d => +d.moyenne),
              backgroundColor: '#4CAF50'
            }]
          },
          chartOptions: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                min: 1,
                max: 5,
                ticks: { stepSize: 1 }
              }
            }
          }
        };
      
        if (!this.chartDataByTheme[theme_id]) {
          this.chartDataByTheme[theme_id] = [];
        }
        this.chartDataByTheme[theme_id].push(chartData);
      
        return chartData;
      });
      
      // ✅ Déplacer ici le tri une fois `chartDataByTheme` entièrement rempli
      this.chartDataByThemeSorted = Object.entries(this.chartDataByTheme)
        .map(([theme_id_str, charts]) => {
          const theme_id = parseInt(theme_id_str, 10);
          return {
            theme_id,
            theme: this.themeIdToName[theme_id] || `Thème ${theme_id}`,
            charts
          };
        })
        .sort((a, b) => a.theme_id - b.theme_id);
      
      // Trie global
      const dataByTheme = new Map<string, GraphRadar[]>();

      radars.forEach(entry => {
        const theme = entry.theme || 'Sans thème';
        if (!dataByTheme.has(theme)) dataByTheme.set(theme, []);
        dataByTheme.get(theme)!.push(entry);
      });

      this.radarCharts = Array.from(dataByTheme.entries()).map(([theme, entries]) => {
        const filteredEntries = entries.filter(
          e => !LABELS_TO_EXCLUDE.includes(e.libelle_graphique?.toLowerCase())
        );
        const labels = [...new Set(filteredEntries.map(e => e.libelle_graphique))];

        const categories = [...new Set(entries.map(e => e.categorie || 'Sans catégorie'))];
        const datasets = categories.map(categorie => {
          const values = labels.map(label => {
            const match = entries.find(e => e.categorie === categorie && e.libelle_graphique === label);
            return match ? match.score : 0;
          });

          return {
            label: categorie,
            data: values
          };
        });

        return {
          theme,
          data: {
            labels,
            datasets
          }
          
        };
      });

      this.data = motsCles;
      this.groupByCategorie();
                      
    });
  }

  private groupByCategorie(): void {
    this.groupedCharts = [];
  
    const motCleData = new Map<number, GraphMotsCles>();
  
    // Indexation initiale
    for (const item of this.data) {
      motCleData.set(item.mot_cle.id_mot_cle, item);
    }
  
    // Agrégation par racine
    const aggregated: Record<string, Record<string, number>> = {}; // categorie -> nom parent -> total
  
    for (const item of this.data) {
      const motCle = item.mot_cle;
      const isChild = motCle.mot_cle_id_groupe !== undefined;
  
      // On récupère l'id du parent si enfant, sinon soi-même
      const rootId = motCle.mot_cle_id_groupe ?? motCle.id_mot_cle;
      const rootMotCle = motCleData.get(rootId)?.mot_cle ?? motCle;
  
      for (const cat of motCle.categories) {
        const catLabel = cat.libelle;
  
        if (!aggregated[catLabel]) {
          aggregated[catLabel] = {};
        }
  
        const nom = rootMotCle.nom;
  
        if (!aggregated[catLabel][nom]) {
          aggregated[catLabel][nom] = 0;
        }
  
        aggregated[catLabel][nom] += item.nombre;
      }
    }
  
    // Création des graphiques
    this.groupedCharts = Object.entries(aggregated).map(([categorie, mots]) => ({
      categorie,
      chartData: {
        type: 'bar',
        data: {
          labels: Object.keys(mots),
          datasets: [{
            data: Object.values(mots),
            label: categorie
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Mot-clé'
              }
            },
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 },
              title: {
                display: true,
                text: 'Nombre d\'occurrences'
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: `Catégorie : ${categorie}`
            }
          }
        }
      }
    }));
  }

  //Groupe les résultats par question
  groupByQuestion(data: ReponseRep[]): { [question: string]: ReponseRep[] } {
    const grouped: { [question: string]: ReponseRep[] } = {};
    for (const item of data) {
      if (!grouped[item.question]) {
        grouped[item.question] = [];
      }
      grouped[item.question].push(item);
    }
    return grouped;
  }


  getChartData(question: string): ChartData<'pie'> {
    return this.chartDataRepartition[question];
  }

  ngOnDestroy(): void {
    this.diagnosticSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }
 
  //Exporte le graphique en png
  exportChart(classe:string,titre:string) {
    const canvas = document.querySelector("."+classe) as HTMLCanvasElement;
    const image = canvas.toDataURL('image/png');
    
    // Création du lien pour téléchargement
    const link = document.createElement('a');
    link.href = image;
    link.download = titre+'.png';
    link.click();
  }
    
}
