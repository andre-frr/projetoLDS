import {gql} from "graphql-tag";

export const historicoCVDocenteTypeDefs = gql`
    type HistoricoCVDocente {
        id_hcd: ID!
        docente: Docente!
        data: String!
        link_cv: String!
    }

    type Query {
        historicoCVDocentes: [HistoricoCVDocente]
        historicoCVDocente(id_hcd: ID!): HistoricoCVDocente
    }

    type Mutation {
        adicionarHistoricoCVDocente(id_doc: Int!, data: String!, link_cv: String!): HistoricoCVDocente
        atualizarHistoricoCVDocente(id_hcd: ID!, id_doc: Int, data: String, link_cv: String): HistoricoCVDocente
        removerHistoricoCVDocente(id_hcd: ID!): HistoricoCVDocente
    }
`;
