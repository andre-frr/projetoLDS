import {executeCustomQuery, getAll, getWithRelations} from '../grpc-helper.js';

export const cursoResolvers = {
    Query: {
        // Complex query: Curso with all UCs nested
        cursoWithUCs: async (_, {id_curso}) => {
            return await getWithRelations('curso', id_curso, ['ucs']);
        },
        // Complex query: All cursos with area info and UC count
        cursosWithAreaAndUCs: async (_, {ativo}) => {
            return await executeCustomQuery('cursosWithAreaAndUCs', {ativo});
        },
    },
    Curso: {
        ucs: async (curso) => {
            if (curso.ucs) {
                return curso.ucs;
            }
            return await getAll('uc', {id_curso: curso.id_curso});
        }
    }
};
