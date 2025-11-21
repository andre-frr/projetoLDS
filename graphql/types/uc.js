import {gql} from "graphql-tag";

export const ucTypeDefs = gql`
    type Uc {
        id_uc: ID!
        nome: String!
        id_curso: Int!
        id_area: Int!
        curso: Curso
        areaCientifica: AreaCientifica
        ano_curso: Int!
        sem_curso: Int!
        ects: Float!
        ativo: Boolean
        horasContacto: [UcHorasContacto]
    }

    type Query {
        # Complex nested query: UC with curso, area, and contact hours
        ucWithDetails(id_uc: ID!): Uc
    }
`;
