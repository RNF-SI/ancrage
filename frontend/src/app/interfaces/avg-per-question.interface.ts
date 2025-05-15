import { ChartData, ChartOptions } from "chart.js";

export interface AvgPerQuestion {
    question: string;
    chart: ChartData<'bar'>;
    chartOptions: ChartOptions<'bar'>;
  }