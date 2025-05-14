export interface AvgPerQuestion {
    question: string;
    chart: {
        labels: string[];
        datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        }[];
    };
}
