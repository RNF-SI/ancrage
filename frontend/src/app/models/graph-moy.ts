import { IGraphMoy } from "@app/interfaces/graph-moy.interface";

export class GraphMoy {
    
    theme ="";
    question = "";
    categorie = "";
    moyenne= 1.2;
    id_question=0;

    static fromJson(data: IGraphMoy): GraphMoy {
        const graph = new GraphMoy();

        graph.theme = data.theme;
        graph.question = data.question;
        graph.categorie = data.categorie;
        graph.moyenne = data.moyenne;
        graph.id_question = data.id_question;

        return graph;
    }
}
