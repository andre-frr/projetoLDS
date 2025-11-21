import {gql} from "graphql-tag";

export const docenteTypeDefs = gql`
    type Docente {
        id_doc: ID!
        nome: String!
        areaCientifica: AreaCientifica
        email: String!
        ativo: Boolean
        convidado: Boolean
        graus: [DocenteGrau]
        historicoCV: [HistoricoCVDocente]
        # Additional fields from joined queries
        area_nome: String
        area_sigla: String
        departamento_nome: String
        departamento_sigla: String
    }

    type Query {
        # Complex nested query: Docente with all relationships (area, graus, CV)
        docenteWithFullDetails(id_doc: ID!): Docente

        # Complex joined query: All docentes with area and department information
        docentesWithFullDetails(ativo: Boolean): [Docente]
    }
`;
