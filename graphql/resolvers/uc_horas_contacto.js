import {getById} from '../grpc-helper.js';

export const ucHorasContactoResolvers = {
    UcHorasContacto: {
        uc: async (horasContacto) => {
            if (horasContacto.uc) {
                return horasContacto.uc;
            }
            return await getById('uc', horasContacto.id_uc);
        }
    }
};


