import { Component, Input, computed, effect, inject, signal } from '@angular/core';
import { ChartConfiguration, ChartData, ChartOptions, RadialLinearScaleOptions } from 'chart.js';
import { Diagnostic } from '@app/models/diagnostic.model';
import { DiagnosticService } from '@app/services/diagnostic.service';
import { forkJoin } from 'rxjs';
import { AvgPerQuestion } from '@app/interfaces/avg-per-question.interface';
import { GraphMotsCles } from '@app/models/graph-mots-cles';
import { GraphMoy } from '@app/models/graph-moy.model';
import { GraphRadar } from '@app/models/graph-radar.model';
import { GraphRepartition } from '@app/models/graph-repartition.model';
import { NgChartsModule } from 'ng2-charts';
import { Labels } from '@app/utils/labels';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';

//Composant qui affcihe les graphiques

export interface RadarChart {
  theme: string;
  data: ChartData<'radar'>;
}

@Component({
  selector: 'app-graphiques',
  templateUrl: './graphiques.component.html',
  styleUrls: ['./graphiques.component.css'],
  imports:[CommonModule,MatTabsModule,NgChartsModule,MatButtonModule]
})
export class GraphiquesComponent {
  @Input('diagnostic') 
  set diagnosticInput(value: Diagnostic) {
    this.diagnosticSignal.set(value);
  }
  labels = new Labels();
  diagnosticSignal = signal<Diagnostic>(new Diagnostic());
  chartDataByQuestion = signal<AvgPerQuestion[]>([]);
  groupedData = signal<{ [question: string]: GraphRepartition[] }>({});
  chartDataRepartition = signal<{ [question: string]: ChartData<'pie'> }>({});
  radarCharts = signal<{ theme: string; data: ChartData<'radar'> }[]>([]);
  chartDataByThemeSorted = signal<{ theme_id: number; theme: string; charts: AvgPerQuestion[] }[]>([]);
  groupedCharts = signal<{ categorie: string; chartData: ChartConfiguration<'bar'> }[]>([]);
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
  data = signal<GraphMotsCles[]>([]);
  colorPalette = ['#0072B2', '#E69F00', '#009E73', '#F0E442', '#CC79A7', '#D55E00', '#999999'];
  themeIdToName: { [theme_id: number]: string } = {};
  private diagnosticService = inject(DiagnosticService);
  radarChartsByTheme = computed(() =>
    this.radarCharts().reduce((acc, chart) => {
      if (!acc[chart.theme]) acc[chart.theme] = [];
      acc[chart.theme].push(chart);
      return acc;
    }, {} as Record<string, RadarChart[]>)
  );
  has_data_graphs=true;
  has_data_afom = true;
  message ="";
  readonly message_graphs = "Veuillez saisir vos entretiens pour voir les graphiques. ";
  readonly message_afom = "Veuillez remplir la partie afom des entretiens. ";

  constructor() {
    effect(() => {
      const diag = this.diagnosticSignal();
      if (diag?.id_diagnostic > 0) {
        this.getCharts(diag.id_diagnostic);
      }
    });
  }

  //Récupération données
  private getCharts(id_diagnostic: number): void {
    const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/’/g, "'").trim();
    const LABELS_TO_EXCLUDE = ["attentes", "Sentiment d'être concerné"].map(normalize);

    forkJoin([
      this.diagnosticService.getAverageByQuestion(id_diagnostic),
      this.diagnosticService.getRepartition(id_diagnostic),
      this.diagnosticService.getRadars(id_diagnostic),
      this.diagnosticService.getOccurencesKeyWords(id_diagnostic)
    ]).subscribe(([graphs, repartitions, radars, motsCles]) => {
      if (graphs.length === 0 || repartitions.length === 0 || radars.length === 0){
        this.has_data_graphs = false;
        this.message += this.message_graphs;
      }
      if(motsCles.length === 0){
        this.has_data_afom = false;
        this.message += this.message_afom;
      }
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
        const responses = repartitionGrouped[question].filter(r => !LABELS_TO_EXCLUDE.includes(normalize(r.reponse || '')));
        const labels = responses.map(r => r.reponse);
        const data = responses.map(r => r.nombre);
        const backgroundColors = labels.map((_, i) => this.colorPalette[i % this.colorPalette.length]);
        chartRepartition[question] = { labels, datasets: [{ data, backgroundColor: backgroundColors }] };
      }
      this.chartDataRepartition.set(chartRepartition);

      this.data.set(motsCles);
      this.groupByCategorie();

      const radarMap = new Map<string, GraphRadar[]>();
      for (const r of radars) {
        const theme = r.theme || 'Sans thème';
        if (!radarMap.has(theme)) radarMap.set(theme, []);
        radarMap.get(theme)!.push(r);
      }

      const radarData = Array.from(radarMap.entries()).map(([theme, entries]) => {
        const filtered = entries.filter(e => !LABELS_TO_EXCLUDE.includes(normalize(e.libelle_graphique || '')));
        const labels = [...new Set(filtered.map(e => e.libelle_graphique))];
        const categories = [...new Set(entries.map(e => e.categorie || 'Sans catégorie'))];
        const datasets = categories.map((cat, i) => {
          const data = labels.map(label => entries.find(e => e.categorie === cat && e.libelle_graphique === label)?.score || 0);
          const color = this.colorPalette[i % this.colorPalette.length];
          return {
            label: cat,
            data,
            borderColor: color,
            backgroundColor: color + '66',
            pointBackgroundColor: color
          };
        });
        return { theme, data: { labels, datasets } };
      });

      this.radarCharts.set(radarData);
    });
  }

  //Affiche les mots-clés par catégorie
  private groupByCategorie(): void {
    const motsCles = this.data();
    const rootMap = new Map<number, GraphMotsCles>();
    motsCles.forEach(m => rootMap.set(m.mot_cle.id_mot_cle, m));

    const aggregated: Record<string, Record<string, number>> = {};
    const rootKeywords = motsCles.filter(m => !m.mot_cle.mot_cle_id_groupe);

    for (const item of rootKeywords) {
      const root = rootMap.get(item.mot_cle.mot_cle_id_groupe ?? item.mot_cle.id_mot_cle)?.mot_cle || item.mot_cle;
      const cat = root.categorie?.libelle || 'Sans catégorie';
      if (!aggregated[cat]) aggregated[cat] = {};
      aggregated[cat][root.nom] = (aggregated[cat][root.nom] || 0) + item.nombre;
    }

    const results = Object.entries(aggregated).map(([categorie, mots]) => ({
      categorie,
      chartData: {
        type: 'bar' as const, 
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
                text: "Nombre d'occurrences"
              }
            }
          },
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: `Catégorie : ${categorie}`
            }
          }
        }
      }
    }));
    this.groupedCharts.set(results);
  }

  getChartData(question: string): ChartData<'pie'> {
    return this.chartDataRepartition()[question];
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