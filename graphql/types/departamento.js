import {gql} from "graphql-tag";

export const departamentoTypeDefs = gql`
    type Departamento {
        id_dep: ID!
        nome: String!
        sigla: String!
        ativo: Boolean
        areasCientificas: [AreaCientifica]
        num_areas: Int
        num_docentes: Int
        num_cursos: Int
    }

    type Query {
        # Complex nested query: Department with all its scientific areas
        departamentoWithDetails(id_dep: ID!): Departamento

        # Complex aggregated query: All departments with statistics
        departamentosWithStats: [Departamento]
    }
`;
