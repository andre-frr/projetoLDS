import {gql} from "graphql-tag";

export const departamentoTypeDefs = gql`
    type Departamento {
        id_dep: ID!
        nome: String!
        sigla: String!
        ativo: Boolean
        areasCientificas: [AreaCientifica]
    }

    type Query {
        departamentos: [Departamento]
        departamento(id_dep: ID!): Departamento
    }

    type Mutation {
        adicionarDepartamento(nome: String!, sigla: String!): Departamento
        atualizarDepartamento(id_dep: ID!, nome: String, sigla: String, ativo: Boolean): Departamento
        removerDepartamento(id_dep: ID!): Departamento
    }
`;
