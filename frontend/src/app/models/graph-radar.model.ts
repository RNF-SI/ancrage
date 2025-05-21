import { IGraphRadar } from "@app/interfaces/graphradar.interface";

export class GraphRadar {
    theme="";
    categorie="";
    score=0;
    libelle_graphique="";

    static fromJson(data: IGraphRadar): GraphRadar {
        const graph = new GraphRadar();

        graph.theme = data.theme;
        graph.score = data.score;
        graph.libelle_graphique= data.libelle_graphique;
        graph.categorie = data.categorie;

        return graph;
    }
}
