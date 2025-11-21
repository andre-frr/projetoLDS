import {gql} from "graphql-tag";

export const historicoCVDocenteTypeDefs = gql`
    type HistoricoCVDocente {
        id_hcd: ID!
        id_doc: Int!
        docente: Docente
        data: String!
        link_cv: String!
    }

`;
