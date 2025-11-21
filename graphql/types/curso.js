import {gql} from "graphql-tag";

export const cursoTypeDefs = gql`
    enum CursoTipo {
        T
        LIC
        MEST
        DOUT
    }

    type Curso {
        id_curso: ID!
        nome: String!
        sigla: String!
        tipo: CursoTipo!
        ativo: Boolean
        ucs: [Uc]
        # Additional fields from joined queries
        area_nome: String
        num_ucs: Int
    }

    type Query {
        # Complex nested query: Curso with all UCs
        cursoWithUCs(id_curso: ID!): Curso

        # Complex joined query: All cursos with area info and UC count
        cursosWithAreaAndUCs(ativo: Boolean): [Curso]
    }
`;
