import { ChartOptions } from "chart.js";

export interface ChartBarData {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string;
    }[];
    options?: ChartOptions<'bar'>;
  }