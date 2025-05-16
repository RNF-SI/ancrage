import { Component, inject, Input, OnInit, SimpleChanges } from '@angular/core';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { Diagnostic } from '@app/models/diagnostic.model';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { GraphMoy } from '@app/models/graph-moy';
import { forkJoin, Subscription } from 'rxjs';
import { AvgPerQuestion } from '@app/interfaces/avg-per-question.interface';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ActivatedRoute } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';
import { GraphRepartition } from '@app/models/graph-repartition';

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
  imports:[CommonModule,MatTabsModule,NgChartsModule]
})

export class GraphiquesComponent{
 
  @Input() diagnostic = new Diagnostic();
  @Input() route = inject(ActivatedRoute);
  chartDataByQuestion?:AvgPerQuestion[];
  private diagnosticService = inject(DiagnosticService);
  private diagnosticSubscription?:Subscription;
  private routeSubscription?:Subscription;
  groupedData: { [question: string]: GraphRepartition[] } = {};
  chartDataByTheme: { [theme: string]: AvgPerQuestion[] } = {};

  ngOnChanges(changes: SimpleChanges): void {
      if (changes['diagnostic']) {
        this.getCharts();
      }
  }

  getCharts(){
    let id_diagnostic = this.diagnostic.id_diagnostic;
    console.log(id_diagnostic);
    const moyennes$ = this.diagnosticService.getAverageByQuestion(id_diagnostic);
    const repartitions$ = this.diagnosticService.getRepartition(id_diagnostic);
    this.diagnosticSubscription = forkJoin([moyennes$,repartitions$]).subscribe(([graphs,repartitions]) => {
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
                min: 0,
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

 
    
}
