import {gql} from "graphql-tag";

export const docenteGrauTypeDefs = gql`
    type Grau {
        id_grau: ID!
        nome: String!
    }

    type DocenteGrau {
        id_dg: ID!
        id_doc: Int!
        id_grau: Int
        docente: Docente
        grau: Grau
        grau_nome: String
        data: String!
        link_certif: String
    }

`;
