import { Component, Input, computed, effect, inject, signal } from '@angular/core';
import { ChartConfiguration, ChartData, ChartOptions, RadialLinearScaleOptions, TooltipItem } from 'chart.js';
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
import { PALETTE_GRAPHIQUES, couleurReponse } from '@app/utils/couleurs-graphiques';
import { exporterCanvasPng, optionsLegende, optionsTitre, tronquerLegende } from '@app/utils/options-graphiques';


//Composant qui affcihe les graphiques

export interface RadarChart {
  theme: string;
  data: ChartData<'radar'>;
  options: ChartOptions<'radar'>;
}

@Component({
  selector: 'app-graphiques',
  templateUrl: './graphiques.component.html',
  styleUrls: ['./graphiques.component.css'],
  imports: [CommonModule, MatTabsModule, NgChartsModule, MatButtonModule]
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
  chartOptionsRepartition = signal<{ [question: string]: ChartOptions<'pie'> }>({});
  radarCharts = signal<RadarChart[]>([]);
  chartDataByThemeSorted = signal<{ theme_id: number; theme: string; charts: AvgPerQuestion[] }[]>([]);
  groupedCharts = signal<{ categorie: string; chartData: ChartConfiguration<'bar'> }[]>([]);
  radarChartOptions: ChartOptions<'radar'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      // Titré explicitement : le radar affiche la même statistique que les
      // barres par question, il faut que ce soit lisible sans deviner.
      title: { display: true, text: this.labels.medianScore }
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
  colorPalette = PALETTE_GRAPHIQUES;
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
            datasets: [{ label: this.labels.medianScore, data: sorted.map(d => d.mediane), backgroundColor: '#4CAF50' }]
          },
          chartOptions: {
            responsive: true,
            scales: {
              y: { beginAtZero: true, min: 1, max: 5, ticks: { stepSize: 1 } }
            },
            plugins: {
              title: optionsTitre(question)
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
      const optionsRepartition: { [question: string]: ChartOptions<'pie'> } = {};

      for (const question in repartitionGrouped) {
        const responses = repartitionGrouped[question]
          .filter(r => !LABELS_TO_EXCLUDE.includes(normalize(r.reponse || '')));
        
        const libellesComplets = responses.map(r => r.reponse ?? '');
        const data = responses.map(r => r.nombre);

        const backgroundColors = responses.map(r => couleurReponse(r));

        chartRepartition[question] = {
          labels: libellesComplets.map(libelle => tronquerLegende(libelle)),
          datasets: [{
            data,
            backgroundColor: backgroundColors,
            hoverBackgroundColor: backgroundColors
           }]
        };

        optionsRepartition[question] = {
          responsive: true,
          plugins: {
            title: optionsTitre(`${this.labels.repartitionReponses} — ${question}`),
            legend: optionsLegende(),
            tooltip: {
              callbacks: {
                // La légende est tronquée pour tenir dans le cadre : l'infobulle
                // reste le seul endroit où lire le libellé en entier.
                title: (items: TooltipItem<'pie'>[]) =>
                  libellesComplets[items[0]?.dataIndex ?? 0] ?? ''
              }
            }
          }
        };
      }

      this.chartDataRepartition.set(chartRepartition);
      this.chartOptionsRepartition.set(optionsRepartition);

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
        const categories = [...new Set(filtered.map(e => e.categorie || 'Sans catégorie'))];
        const datasets = categories.map((cat, i) => {
          // null et non 0 : une question sans réponse notée pour ce groupe est une
          // absence de donnée, la tracer à 0 écraserait visuellement le radar.
          const data = labels.map(label => {
            const entree = filtered.find(e => e.categorie === cat && e.libelle_graphique === label);
            return entree?.score ?? null;
          });
          const color = this.colorPalette[i % this.colorPalette.length];
          return {
            label: cat,
            data,
            borderColor: color,
            backgroundColor: 'transparent',
            fill: false  
          };
        });
        return { theme, data: { labels, datasets }, options: this.optionsRadar(theme) };
      });

      this.radarCharts.set(radarData);
    });
  }

  //Affiche les mots-clés par catégorie
  private groupByCategorie(): void {
    // L'API ne renvoie que des racines : les mots-clés regroupés par l'enquêteur
    // sont déjà repliés dans mots_cles_issus, et `nombre` porte le total du
    // groupe (acteurs distincts du parent et de ses enfants). Une barre par
    // racine suffit donc à refléter les regroupements.
    const aggregated: Record<string, Record<string, number>> = {};

    for (const item of this.data()) {
      const mot_cle = item.mot_cle;
      const cat = mot_cle.categorie?.libelle || 'Sans catégorie';
      if (!aggregated[cat]) aggregated[cat] = {};
      aggregated[cat][mot_cle.nom] = (aggregated[cat][mot_cle.nom] || 0) + item.nombre;
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

  getChartOptions(question: string): ChartOptions<'pie'> {
    return this.chartOptionsRepartition()[question];
  }

  /** Options d'un radar, titré de son thème pour que le PNG exporté se suffise. */
  private optionsRadar(theme: string): ChartOptions<'radar'> {
    return {
      ...this.radarChartOptions,
      plugins: {
        ...this.radarChartOptions.plugins,
        title: optionsTitre(`${theme} — ${this.labels.medianScore}`)
      }
    };
  }

 
  //Exporte le graphique en png
  exportChart(classe: string, titre: string) {
    exporterCanvasPng(classe, titre);
  }

}