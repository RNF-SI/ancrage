import { IGraphRepartition } from "@app/interfaces/igraph-repartition";

export class GraphRepartition {
    nombre = 0;
    question = "";
    reponse= "";
    theme = "";
    score = 0;
    id_question=0;

    static fromJson(data: IGraphRepartition): GraphRepartition {
            const graph = new GraphRepartition();
    
            graph.theme = data.theme;
            graph.question = data.question;
            graph.nombre = data.nombre;
            graph.reponse = data.reponse;
            graph.score = data.score;
            graph.id_question = graph.id_question;
    
            return graph;
    }
}
