import {gql} from "graphql-tag";

export const docenteGrauTypeDefs = gql`
    type DocenteGrau {
        id_dg: ID!
        docente: Docente!
        grau: Grau
        grau_nome: String
        data: String!
        link_certif: String
    }

    type Query {
        docenteGraus: [DocenteGrau]
        docenteGrau(id_dg: ID!): DocenteGrau
    }

    type Mutation {
        adicionarDocenteGrau(id_doc: Int!, id_grau: Int, grau_nome: String, data: String!, link_certif: String): DocenteGrau
        atualizarDocenteGrau(id_dg: ID!, id_doc: Int, id_grau: Int, grau_nome: String, data: String, link_certif: String): DocenteGrau
        removerDocenteGrau(id_dg: ID!): DocenteGrau
    }
`;
