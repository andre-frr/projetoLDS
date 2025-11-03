import {gql} from "graphql-tag";

export const ucHorasContactoTypeDefs = gql`
    enum TipoHora {
        PL
        T
        TP
        OT
    }

    type UcHorasContacto {
        uc: Uc!
        tipo: TipoHora!
        horas: Int!
    }

    type Query {
        ucHorasContactos(id_uc: ID!): [UcHorasContacto]
    }

    type Mutation {
        adicionarUcHorasContacto(id_uc: Int!, tipo: TipoHora!, horas: Int!): UcHorasContacto
        atualizarUcHorasContacto(id_uc: Int!, tipo: TipoHora!, horas: Int!): UcHorasContacto
        removerUcHorasContacto(id_uc: Int!, tipo: TipoHora!): UcHorasContacto
    }
`;
