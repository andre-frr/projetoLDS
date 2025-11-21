import {getById} from '../grpc-helper.js';

export const docenteGrauResolvers = {
    DocenteGrau: {
        docente: async (docenteGrau) => {
            if (docenteGrau.docente) {
                return docenteGrau.docente;
            }
            return await getById('docente', docenteGrau.id_doc);
        },
        grau: async (docenteGrau) => {
            if (!docenteGrau.id_grau) return null;
            if (docenteGrau.grau) {
                return docenteGrau.grau;
            }
            return await getById('grau', docenteGrau.id_grau);
        }
    }
};
