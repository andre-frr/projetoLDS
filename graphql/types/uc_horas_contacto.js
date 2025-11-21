import {gql} from "graphql-tag";

export const ucHorasContactoTypeDefs = gql`
    enum TipoHora {
        PL
        T
        TP
        OT
    }

    type UcHorasContacto {
        id_uc: Int!
        uc: Uc
        tipo: TipoHora!
        horas: Int!
    }

`;
