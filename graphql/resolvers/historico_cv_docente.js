import {getById} from '../grpc-helper.js';

export const historicoCVDocenteResolvers = {
    HistoricoCVDocente: {
        docente: async (historico) => {
            if (historico.docente) {
                return historico.docente;
            }
            return await getById('docente', historico.id_doc);
        }
    }
};
