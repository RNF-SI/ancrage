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
import { ChartData, ChartOptions, RadialLinearScaleOptions } from 'chart.js';
import { GraphRepartition } from '@app/models/graph-repartition.model';
import { MatButtonModule } from '@angular/material/button';
import { Labels } from '@app/utils/labels';
import { GraphRadar } from '@app/models/graph-radar.model';

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
  chartDataByTheme: { [theme: string]: AvgPerQuestion[] } = {};
  labels = new Labels();
  radarCharts: {
    theme: string;
    data: ChartData<'radar'>;
  }[] = [];

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

  ngOnChanges(changes: SimpleChanges): void {
      if (changes['diagnostic']) {
        this.getCharts();
      }
  }

  getCharts(){
    let id_diagnostic = this.diagnostic.id_diagnostic;
    const moyennes$ = this.diagnosticService.getAverageByQuestion(id_diagnostic);
    const repartitions$ = this.diagnosticService.getRepartition(id_diagnostic);
    const radars$ = this.diagnosticService.getRadars(id_diagnostic);
    this.diagnosticSubscription = forkJoin([moyennes$,repartitions$,radars$]).subscribe(([graphs,repartitions,radars]) => {
      const grouped = new Map<string, GraphMoy[]>();
      for (const entry of graphs) {
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
      this.chartDataByQuestion = Array.from(grouped.entries()).map(([question, data]) => {
        const sorted = [...data].sort((a, b) => a.categorie.localeCompare(b.categorie));
        const id_question = sorted[0]?.id_question;
        const theme = sorted[0]?.theme || "Autres"; // On récupère le thème depuis GraphMoy
      
        const chartData: AvgPerQuestion = {
          id_question,
          question,
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
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        };
      
        if (!this.chartDataByTheme[theme]) {
          this.chartDataByTheme[theme] = [];
        }
        this.chartDataByTheme[theme].push(chartData);
      
        return chartData;

        
      });
      const dataByTheme = new Map<string, GraphRadar[]>();

      radars.forEach(entry => {
        const theme = entry.theme || 'Sans thème';
        if (!dataByTheme.has(theme)) dataByTheme.set(theme, []);
        dataByTheme.get(theme)!.push(entry);
      });

      this.radarCharts = Array.from(dataByTheme.entries()).map(([theme, entries]) => {
        const labels = [...new Set(entries.map(e => e.libelle_graphique))];

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
                    
    });
  }
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
    const responses = this.groupedData[question];
    return {
      labels: responses.map(r => r.reponse),
      datasets: [{
        data: responses.map(r => r.nombre),
      }]
    };
  }

  chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  ngOnDestroy(): void {
    this.diagnosticSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }
 
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
