import {gql} from "graphql-tag";

export const areaCientificaTypeDefs = gql`
    type AreaCientifica {
        id_area: ID!
        nome: String!
        sigla: String!
        departamento: Departamento!
        ativo: Boolean
        docentes: [Docente]
        ucs: [Uc]
    }

    type Query {
        areasCientificas: [AreaCientifica]
        areaCientifica(id_area: ID!): AreaCientifica
    }

    type Mutation {
        adicionarAreaCientifica(nome: String!, sigla: String!, id_dep: Int!): AreaCientifica
        atualizarAreaCientifica(id_area: ID!, nome: String, sigla: String, id_dep: Int, ativo: Boolean): AreaCientifica
        removerAreaCientifica(id_area: ID!): AreaCientifica
    }
`;
