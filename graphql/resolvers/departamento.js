import {executeCustomQuery, getAll, getWithRelations} from '../grpc-helper.js';

export const departamentoResolvers = {
    Query: {
        // Complex query: Department with nested areas and docentes
        departamentoWithDetails: async (_, {id_dep}) => {
            return await getWithRelations('departamento', id_dep, ['areasCientificas']);
        },
        // Complex query: All departments with statistics
        departamentosWithStats: async () => {
            return await executeCustomQuery('departamentosWithStats');
        },
    },
    Departamento: {
        areasCientificas: async (departamento) => {
            // If already loaded from nested query, return it
            if (departamento.areasCientificas) {
                return departamento.areasCientificas;
            }
            // Otherwise fetch via gRPC
            return await getAll('area_cientifica', {id_dep: departamento.id_dep});
        }
    }
};
