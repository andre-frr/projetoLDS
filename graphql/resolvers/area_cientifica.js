import {getAll, getById, getWithRelations} from '../grpc-helper.js';

export const areaCientificaResolvers = {
    Query: {
        // Complex query: Area with all related entities
        areaWithDetails: async (_, {id_area}) => {
            return await getWithRelations('area_cientifica', id_area, ['departamento', 'docentes']);
        },
    },
    AreaCientifica: {
        departamento: async (areaCientifica) => {
            if (areaCientifica.departamento) {
                return areaCientifica.departamento;
            }
            return await getById('departamento', areaCientifica.id_dep);
        },
        docentes: async (areaCientifica) => {
            if (areaCientifica.docentes) {
                return areaCientifica.docentes;
            }
            return await getAll('docente', {id_area: areaCientifica.id_area});
        },
        ucs: async (areaCientifica) => {
            if (areaCientifica.ucs) {
                return areaCientifica.ucs;
            }
            return await getAll('uc', {id_area: areaCientifica.id_area});
        }
    }
};
