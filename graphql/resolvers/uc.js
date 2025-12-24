import {getAll, getById, getWithRelations} from '../grpc-helper.js';

export const ucResolvers = {
    Query: {
        // Complex query: UC with all related entities (curso, area, horas contacto)
        ucWithDetails: async (_, {id_uc}) => {
            return await getWithRelations('uc', id_uc, ['curso', 'horasContacto']);
        },
    },
    Uc: {
        curso: async (uc) => {
            if (uc.curso) {
                return uc.curso;
            }
            return await getById('curso', uc.id_curso);
        },
        areaCientifica: async (uc) => {
            if (uc.areaCientifica) {
                return uc.areaCientifica;
            }
            return await getById('area_cientifica', uc.id_area);
        },
        horasContacto: async (uc) => {
            if (uc.horasContacto) {
                return uc.horasContacto;
            }
            return await getAll('uc_horas_contacto', {id_uc: uc.id_uc});
        }
    }
};
