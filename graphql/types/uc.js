import {gql} from "graphql-tag";

export const ucTypeDefs = gql`
    type Uc {
        id_uc: ID!
        nome: String!
        curso: Curso!
        areaCientifica: AreaCientifica!
        ano_curso: Int!
        sem_curso: Int!
        ects: Float!
        ativo: Boolean
        horasContacto: [UcHorasContacto]
    }

    type Query {
        ucs: [Uc]
        uc(id_uc: ID!): Uc
    }

    type Mutation {
        adicionarUc(nome: String!, id_curso: Int!, id_area: Int!, ano_curso: Int!, sem_curso: Int!, ects: Float!): Uc
        atualizarUc(id_uc: ID!, nome: String, id_curso: Int, id_area: Int, ano_curso: Int, sem_curso: Int, ects: Float, ativo: Boolean): Uc
        removerUc(id_uc: ID!): Uc
    }
`;
