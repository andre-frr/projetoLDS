import {getWithRelations, getAll, getById, executeCustomQuery} from '../grpc-helper.js';

export const docenteResolvers = {
    Query: {
        // Complex query: Docente with all nested relationships
        docenteWithFullDetails: async (_, {id_doc}) => {
            return await getWithRelations('docente', id_doc, ['areaCientifica', 'graus', 'historicoCV']);
        },
        // Complex query: All docentes with area and department info
        docentesWithFullDetails: async (_, {ativo}) => {
            return await executeCustomQuery('docentesWithFullDetails', {ativo});
        },
    },
    Docente: {
        areaCientifica: async (docente) => {
            if (docente.areaCientifica) {
                return docente.areaCientifica;
            }
            return await getById('area_cientifica', docente.id_area);
        },
        graus: async (docente) => {
            if (docente.graus) {
                return docente.graus;
            }
            return await getAll('docente_grau', {id_doc: docente.id_doc});
        },
        historicoCV: async (docente) => {
            if (docente.historicoCV) {
                return docente.historicoCV;
            }
            return await getAll('historico_cv_docente', {id_doc: docente.id_doc});
        }
    }
};
