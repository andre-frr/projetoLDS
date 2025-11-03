import {gql} from "graphql-tag";

export const docenteTypeDefs = gql`
    type Docente {
        id_doc: ID!
        nome: String!
        areaCientifica: AreaCientifica!
        email: String!
        ativo: Boolean
        convidado: Boolean
        graus: [DocenteGrau]
        historicoCV: [HistoricoCVDocente]
    }

    type Query {
        docentes: [Docente]
        docente(id_doc: ID!): Docente
    }

    type Mutation {
        adicionarDocente(nome: String!, id_area: Int!, email: String!, convidado: Boolean): Docente
        atualizarDocente(id_doc: ID!, nome: String, id_area: Int, email: String, ativo: Boolean, convidado: Boolean): Docente
        removerDocente(id_doc: ID!): Docente
    }
`;
