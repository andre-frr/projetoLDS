import {gql} from "graphql-tag";

export const grauTypeDefs = gql`
    type Grau {
        id_grau: ID!
        nome: String!
    }

    type Query {
        graus: [Grau]
        grau(id_grau: ID!): Grau
    }

    type Mutation {
        adicionarGrau(nome: String!): Grau
        atualizarGrau(id_grau: ID!, nome: String!): Grau
        removerGrau(id_grau: ID!): Grau
    }
`;
