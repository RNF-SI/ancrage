import { ChartData, ChartOptions } from "chart.js";

export interface AvgPerQuestion {
    question: string;
    id_question:number;
    chart: ChartData<'bar'>;
    chartOptions: ChartOptions<'bar'>;
    theme_id:number;
}