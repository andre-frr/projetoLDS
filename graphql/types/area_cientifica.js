import {gql} from "graphql-tag";

export const areaCientificaTypeDefs = gql`
    type AreaCientifica {
        id_area: ID!
        nome: String!
        sigla: String!
        id_dep: Int!
        departamento: Departamento
        ativo: Boolean
        docentes: [Docente]
        ucs: [Uc]
        # Additional fields from joined queries
        nome_departamento: String
    }

    type Query {
        # Complex nested query: Area with department and related entities
        areaWithDetails(id_area: ID!): AreaCientifica
    }
`;
