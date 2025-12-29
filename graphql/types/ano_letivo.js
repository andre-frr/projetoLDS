export const anoLetivoTypeDefs = `#graphql
type AnoLetivo {
    id_ano: Int!
    ano_inicio: Int!
    ano_fim: Int!
    arquivado: Boolean!
    is_current: Boolean
}

input AnoLetivoInput {
    ano_inicio: Int!
    ano_fim: Int!
}

type Query {
    anosLetivos: [AnoLetivo!]!
    anoLetivo(id: Int!): AnoLetivo
    anoLetivoAtual: AnoLetivo
}

type Mutation {
    criarAnoLetivo(input: AnoLetivoInput!, createNewYear: Boolean): AnoLetivo!
    atualizarAnoLetivo(id: Int!, input: AnoLetivoInput!): AnoLetivo!
    eliminarAnoLetivo(id: Int!): Boolean!
}
`;
