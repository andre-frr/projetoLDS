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
    }

    type Query {
        cursos: [Curso]
        curso(id_curso: ID!): Curso
    }

    type Mutation {
        adicionarCurso(nome: String!, sigla: String!, tipo: CursoTipo!): Curso
        atualizarCurso(id_curso: ID!, nome: String, sigla: String, tipo: CursoTipo, ativo: Boolean): Curso
        removerCurso(id_curso: ID!): Curso
    }
`;
