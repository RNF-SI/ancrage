import { IGraphMoy } from "@app/interfaces/graph-moy.interface";

export class GraphMoy {
    
    theme ="";
    question = "";
    categorie = "";
    mediane= 1.2;
    id_question=0;
    theme_id=0;

    static fromJson(data: IGraphMoy): GraphMoy {
        const graph = new GraphMoy();

        graph.theme = data.theme;
        graph.question = data.question;
        graph.categorie = data.categorie;
        graph.mediane = data.mediane;
        graph.id_question = data.id_question;
        graph.theme_id = data.theme_id;

        return graph;
    }
}
