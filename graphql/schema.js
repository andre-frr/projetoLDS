import { gql } from "graphql-tag";

export const typeDefs = gql`
  type Departamento {
    id_dep: ID!
    nome: String!
    sigla: String!
    ativo: Boolean
  }

  type Query {
    departamentos: [Departamento]
    departamento(id_dep: ID!): Departamento
  }

  type Mutation {
    adicionarDepartamento(nome: String!, sigla: String!): Departamento
  }
`;
