import { Component, inject, Input, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { Diagnostic } from '@app/models/diagnostic.model';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { GraphMoy } from '@app/utils/graph-moy';
import { Subscription } from 'rxjs';
import { AvgPerQuestion } from '@app/interfaces/avg-per-question.interface';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';


@Component({
  selector: 'app-graphiques',
  templateUrl: './graphiques.component.html',
  styleUrls: ['./graphiques.component.css'],
  standalone:true,
  imports:[CommonModule,MatTabsModule,NgChartsModule]
})

export class GraphiquesComponent implements OnInit{
  
  @Input() diagnostic = new Diagnostic();
  chartDataByQuestion?:AvgPerQuestion[];
  private diagnosticService = inject(DiagnosticService);
  private diagnosticSubscription?:Subscription;

  ngOnInit() {

    this.diagnosticSubscription = this.diagnosticService.getAverageByQuestion().subscribe(graphs => {
      const grouped = new Map<string, GraphMoy[]>();
      console.log(graphs)
      for (const entry of graphs) {
        if (!grouped.has(entry.question)) {
          grouped.set(entry.question, []);
        }
        grouped.get(entry.question)?.push(entry);
      }
    
      this.chartDataByQuestion = Array.from(grouped.entries()).map(([question, data]) => {
        const sorted = [...data].sort((a, b) => a.categorie.localeCompare(b.categorie));
      
        return {
          question,
          chart: {
            labels: sorted.map(d => d.categorie),
            datasets: [{
              label: 'Score moyen',
              data: sorted.map(d => +d.moyenne),
              backgroundColor: '#4CAF50'
            }],
            // 👇 Options d'affichage de l'axe Y
            options: {
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
          }
        };
      });
    });
    
  }
}