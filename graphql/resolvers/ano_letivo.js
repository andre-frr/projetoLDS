import {create, deleteRecord, executeCustomQuery, getAll, getById, update} from "../grpc-helper.js";

function validateYearRange(anoInicio, anoFim) {
    if (anoFim <= anoInicio) {
        throw new Error("O ano de fim deve ser posterior ao ano de início.");
    }
}

function checkDuplicate(years, anoInicio, anoFim, excludeId = null) {
    const duplicate = years.find(
        (year) =>
            year.ano_inicio === anoInicio &&
            year.ano_fim === anoFim &&
            (excludeId ? year.id_ano !== excludeId : true)
    );

    if (duplicate) {
        throw new Error("Ano letivo já existe.");
    }
}

function findCurrentYear(years) {
    const currentYear = new Date().getFullYear();

    const current = years.find(
        (year) => year.ano_inicio <= currentYear && year.ano_fim >= currentYear
    );

    if (current) {
        return {...current, is_current: true};
    }

    if (years.length > 0) {
        return {...years[0], is_current: false};
    }

    return null;
}

export const anoLetivoResolvers = {
    Query: {
        anosLetivos: async () => {
            return await getAll("ano_letivo");
        },

        anoLetivo: async (_, {id}) => {
            return await getById("ano_letivo", id);
        },

        anoLetivoAtual: async () => {
            const years = await getAll("ano_letivo");
            return findCurrentYear(years);
        },
    },

    Mutation: {
        criarAnoLetivo: async (_, {input}) => {
            const {ano_inicio, ano_fim} = input;

            validateYearRange(ano_inicio, ano_fim);

            const existing = await getAll("ano_letivo");
            checkDuplicate(existing, ano_inicio, ano_fim);

            return await create("ano_letivo", {ano_inicio, ano_fim});
        },

        atualizarAnoLetivo: async (_, {id, input}) => {
            const {ano_inicio, ano_fim} = input;

            validateYearRange(ano_inicio, ano_fim);

            const existing = await getById("ano_letivo", id);
            if (!existing) {
                throw new Error("Ano letivo não encontrado.");
            }

            // Check if year is archived
            if (existing.arquivado) {
                throw new Error(
                    "Não é possível editar um ano letivo arquivado. Anos arquivados são apenas para consulta histórica."
                );
            }

            const allYears = await getAll("ano_letivo");
            checkDuplicate(allYears, ano_inicio, ano_fim, id);

            return await update("ano_letivo", id, {ano_inicio, ano_fim});
        },

        eliminarAnoLetivo: async (_, {id}) => {
            const existing = await getById("ano_letivo", id);
            if (!existing) {
                throw new Error("Ano letivo não encontrado.");
            }

            // Check if year is archived
            if (existing.arquivado) {
                throw new Error(
                    "Não é possível eliminar um ano letivo arquivado. Anos arquivados devem ser preservados para histórico."
                );
            }

            const result = await executeCustomQuery("checkAnoLetivoAssociations", {
                id_ano: id,
            });

            if (result[0]?.has_data) {
                throw new Error(
                    "Não é possível eliminar um ano letivo com dados associados. Os dados históricos devem ser preservados."
                );
            }

            await deleteRecord("ano_letivo", id);
            return true;
        },
    },
};

